import { Request, Response, NextFunction } from 'express'
import { AnyZodObject } from 'zod'

const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      // Write the parsed `body` back so Zod defaults/coercion reach the controller.
      // (Express 5 `req.query`/`req.params` are read-only getters, so only `body` is assigned.)
      if (parsed && typeof parsed === 'object' && 'body' in parsed) {
        req.body = (parsed as { body: unknown }).body
      }
      next()
    } catch (error) {
      next(error)
    }
  }

export default validateRequest
