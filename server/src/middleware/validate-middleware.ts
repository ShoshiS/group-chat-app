import type { NextFunction, Request, Response } from 'express';
import type { ObjectSchema } from 'joi';

/**
 * Factory that returns a middleware validating `req.body` against the given Joi schema.
 * On success it replaces `req.body` with the coerced/stripped value.
 */
export function validateBody(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details.map((d) => d.message).join(', ') });
      return;
    }
    req.body = value;
    next();
  };
}
