import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { describeValues, diffFields } from '../audit/audit-diff.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../audit/audit.types.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { isDuplicateKeyError } from '../common/utils/mongo-errors.js';
import { withTransaction } from '../common/utils/with-transaction.js';
import { isDemoEmail } from '../demo/demo.constants.js';
import type { CreateWorkplaceDto } from './dto/create-workplace.dto.js';
import type { UpdateWorkplaceDto } from './dto/update-workplace.dto.js';
import { Workplace } from './schemas/workplace.schema.js';

const AUDITED_FIELDS = [
  'name',
  'latitude',
  'longitude',
  'radiusMeters',
  'isActive',
] as const;

export interface WorkplaceView {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

function toView(
  workplace: Pick<
    Workplace,
    'name' | 'latitude' | 'longitude' | 'radiusMeters' | 'isActive'
  > & { _id: unknown },
): WorkplaceView {
  return {
    id: String(workplace._id),
    name: workplace.name,
    latitude: workplace.latitude,
    longitude: workplace.longitude,
    radiusMeters: workplace.radiusMeters,
    isActive: workplace.isActive,
  };
}

@Injectable()
export class WorkplacesService {
  constructor(
    @InjectModel(Workplace.name)
    private readonly workplaceModel: Model<Workplace>,
    @InjectConnection() private readonly connection: Connection,
    private readonly audit: AuditService,
  ) {}

  async list(viewer: JwtPayload) {
    const workplaces = await this.workplaceModel
      .find({ isDemo: isDemoEmail(viewer.email) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return workplaces.map(toView);
  }

  findActive() {
    return this.workplaceModel
      .find({ isActive: true, isDemo: false })
      .lean()
      .exec();
  }

  async create(dto: CreateWorkplaceDto, actor: JwtPayload) {
    try {
      const created = await withTransaction(
        this.connection,
        async (session) => {
          const [workplace] = await this.workplaceModel.create(
            [{ ...dto, isDemo: isDemoEmail(actor.email) }],
            { session },
          );
          await this.audit.record(
            {
              action: AuditAction.WORKPLACE_CREATED,
              actor,
              targetId: workplace._id,
              targetLabel: workplace.name,
              changes: describeValues({
                latitude: workplace.latitude,
                longitude: workplace.longitude,
                radiusMeters: workplace.radiusMeters,
              }),
            },
            session,
          );
          return workplace;
        },
      );

      return toView(created.toObject());
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async update(id: string, dto: UpdateWorkplaceDto, actor: JwtPayload) {
    const workplace = await this.findOwned(id, actor);
    const changes = diffFields(workplace.toObject(), dto, AUDITED_FIELDS);

    try {
      await withTransaction(this.connection, async (session) => {
        await this.workplaceModel
          .updateOne({ _id: id }, { ...dto }, { session })
          .exec();
        if (changes.length > 0) {
          await this.audit.record(
            {
              action: AuditAction.WORKPLACE_UPDATED,
              actor,
              targetId: workplace._id,
              targetLabel: dto.name ?? workplace.name,
              changes,
            },
            session,
          );
        }
      });
    } catch (error) {
      throw this.mapError(error);
    }

    return { success: true };
  }

  async remove(id: string, actor: JwtPayload) {
    const workplace = await this.findOwned(id, actor);

    await withTransaction(this.connection, async (session) => {
      await this.workplaceModel.deleteOne({ _id: id }, { session }).exec();
      await this.audit.record(
        {
          action: AuditAction.WORKPLACE_DELETED,
          actor,
          targetId: workplace._id,
          targetLabel: workplace.name,
          changes: [],
        },
        session,
      );
    });

    return { success: true };
  }

  private async findOwned(id: string, actor: JwtPayload) {
    const workplace = await this.workplaceModel
      .findOne({ _id: id, isDemo: isDemoEmail(actor.email) })
      .exec();
    if (!workplace) throw new NotFoundException('Work location not found');
    return workplace;
  }

  private mapError(error: unknown) {
    return isDuplicateKeyError(error)
      ? new BadRequestException('A location with this name already exists')
      : error;
  }
}
