import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') || 'field';
        message = `Duplicate value: ${target} already exists`;
        break;

      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference: related record not found';
        break;

      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'The change would violate a required relation';
        break;

      case 'P2021':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database table does not exist';
        break;

      case 'P2022':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database column does not exist';
        break;
    }

    response.status(status).json({
      success: false,
      error: message,
      details:
        process.env.NODE_ENV === 'development'
          ? { code: exception.code, meta: exception.meta }
          : undefined,
    });
  }
}
