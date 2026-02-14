import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export function createError(
  message: string,
  code: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  const err = new Error(message) as AppError;
  err.code = code;
  err.statusCode = statusCode;
  err.details = details;
  return err;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const code = err.code || 'INTERNAL_ERROR';
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  const details = process.env.NODE_ENV === 'development' && err.details !== undefined
    ? err.details
    : err.details;

  console.error(`[${code}]`, err.message, err.details !== undefined ? err.details : '');

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  });
}
