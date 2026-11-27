import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ExceptionBody {
  message?: string | string[];
  code?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const body: ExceptionBody = typeof payload === 'string' ? {} : payload;
      const raw = typeof payload === 'string' ? payload : body.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : (raw ?? exception.message);
      res.status(exception.getStatus()).json({
        error: message,
        ...(body.code ? { code: body.code } : {}),
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Internal server error' });
  }
}
