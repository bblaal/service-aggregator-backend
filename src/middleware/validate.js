const createHttpError = require("http-errors");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) return next(createHttpError(400, error.details.map(d => d.message).join(", ")));
    req[source] = value;
    next();
  };
}

module.exports = { validate };
