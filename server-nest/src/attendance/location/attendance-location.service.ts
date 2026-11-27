import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationStatus } from '../../common/enums/location-status.enum.js';
import { WorkplacesService } from '../../workplaces/workplaces.service.js';
import {
  evaluateLocation,
  type LocationSample,
  type WorkplaceZone,
} from '../geo/location-check.js';
import type { LocationProof } from '../schemas/attendance.schema.js';
import { LocationException } from './location-exception.js';

const METERS_PER_KILOMETER = 1000;

export interface LocationPolicy {
  required: boolean;
  workplaces: WorkplaceZone[];
}

interface Subject {
  canCheckInAnywhere?: boolean;
}

function formatDistance(meters: number) {
  return meters >= METERS_PER_KILOMETER
    ? `${(meters / METERS_PER_KILOMETER).toFixed(1)} km`
    : `${meters} m`;
}

const unverified = (accuracy: number | null): LocationProof => ({
  status: LocationStatus.UNVERIFIED,
  workplaceName: null,
  distanceMeters: null,
  accuracyMeters: accuracy === null ? null : Math.round(accuracy),
});

@Injectable()
export class AttendanceLocationService {
  constructor(
    private readonly workplaces: WorkplacesService,
    private readonly config: ConfigService,
  ) {}

  async policyFor(employee: Subject): Promise<LocationPolicy> {
    if (
      this.config.get<boolean>('DEMO_MODE') === true ||
      employee.canCheckInAnywhere
    ) {
      return { required: false, workplaces: [] };
    }

    const active = await this.workplaces.findActive();
    return {
      required: active.length > 0,
      workplaces: active.map(({ name, latitude, longitude, radiusMeters }) => ({
        name,
        latitude,
        longitude,
        radiusMeters,
      })),
    };
  }

  async verifyCheckIn(
    employee: Subject,
    sample: LocationSample | undefined,
    now: Date,
  ): Promise<LocationProof | null> {
    const policy = await this.policyFor(employee);
    if (!policy.required) return null;

    if (!sample) {
      throw new LocationException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'LOCATION_REQUIRED',
        'Allow location access to clock in.',
      );
    }

    const verdict = evaluateLocation(sample, policy.workplaces, now);
    switch (verdict.kind) {
      case 'STALE':
        throw new LocationException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'LOCATION_STALE',
          'Your device clock looks wrong. Fix the date and time on your device, then try again.',
        );
      case 'LOW_ACCURACY':
        throw new LocationException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'LOCATION_LOW_ACCURACY',
          'Your location is not precise enough. Move near a window or turn on Wi-Fi and GPS, then try again.',
        );
      case 'OUTSIDE':
        throw new LocationException(
          HttpStatus.FORBIDDEN,
          'OUTSIDE_WORKPLACE',
          `You are ${formatDistance(verdict.distanceMeters)} from ${verdict.zone.name} (allowed ${verdict.zone.radiusMeters} m).`,
        );
      case 'INSIDE':
        return {
          status: LocationStatus.INSIDE,
          workplaceName: verdict.zone.name,
          distanceMeters: verdict.distanceMeters,
          accuracyMeters: Math.round(sample.accuracy),
        };
    }
  }

  async proofForCheckOut(
    employee: Subject,
    sample: LocationSample | undefined,
    now: Date,
  ): Promise<LocationProof | null> {
    const policy = await this.policyFor(employee);
    if (!policy.required) return null;
    if (!sample) return unverified(null);

    const verdict = evaluateLocation(sample, policy.workplaces, now);
    if (verdict.kind === 'STALE' || verdict.kind === 'LOW_ACCURACY') {
      return unverified(sample.accuracy);
    }

    return {
      status:
        verdict.kind === 'INSIDE'
          ? LocationStatus.INSIDE
          : LocationStatus.OUTSIDE,
      workplaceName: verdict.zone.name,
      distanceMeters: verdict.distanceMeters,
      accuracyMeters: Math.round(sample.accuracy),
    };
  }
}
