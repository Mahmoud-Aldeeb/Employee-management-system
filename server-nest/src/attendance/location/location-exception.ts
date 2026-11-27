import { HttpException } from '@nestjs/common';

export type LocationErrorCode =
  | 'LOCATION_REQUIRED'
  | 'LOCATION_LOW_ACCURACY'
  | 'LOCATION_STALE'
  | 'OUTSIDE_WORKPLACE';

export class LocationException extends HttpException {
  constructor(status: number, code: LocationErrorCode, message: string) {
    super({ message, code }, status);
  }
}
