import createError from "../utils/createError.js";

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);

        for (const key of Object.keys(req.query)) {
          delete req.query[key];
        }

        Object.assign(req.query, parsedQuery);
      }

      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);

        for (const key of Object.keys(req.params)) {
          delete req.params[key];
        }

        Object.assign(req.params, parsedParams);
      }

      next();
    } catch (error) {
      if (error.name === "ZodError") {
        const details = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return createError(res, 400, "Validation failed", details);
      }

      next(error);
    }
  };
};
