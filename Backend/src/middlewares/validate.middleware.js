import { ApiError } from "../utils/ApiError.js";

/**
 * Higher-order middleware function to validate incoming requests using Zod schemas.
 * It checks body, query, and params based on the provided schema.
 */
export const validate = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace request data with sanitized/validated data
        req.body = validatedData.body;
        req.query = validatedData.query;
        req.params = validatedData.params;

        next();
    } catch (error) {
        let message = "Validation failed";
        let errors = [];

        if (error.errors) {
            // Map Zod errors to a more readable format
            errors = error.errors.map((err) => ({
                path: err.path.join("."),
                message: err.message,
            }));
            message = errors[0].message; // Use the first error as the top-level message
        }

        next(new ApiError(400, message, errors));
    }
};
