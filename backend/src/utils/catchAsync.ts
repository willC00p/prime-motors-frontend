import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

type AsyncHandler = (
  req: Request<ParamsDictionary, any, any, ParsedQs>,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncHandler): AsyncHandler => {
    return async (req, res, next) => {
        try {
            return await fn(req, res, next);
        } catch (error) {
            next(error);
            return Promise.reject(error);
        }
    };
};
