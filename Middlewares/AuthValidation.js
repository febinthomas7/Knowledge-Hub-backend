const Joi = require("joi");
const signinValidation = async (req, res, next) => {
  // Joi schema definition for basic validation
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string()
      .email()
      .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
      .required(),
    password: Joi.string().min(4).max(100).required(),
  });

  // Validate the body against the schema
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      message: "Invalid email domain",
    });
  }

  next();
};

const logininValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error, message: "Bad request" });
  }
  next();
};

module.exports = {
  signinValidation,
  logininValidation,
};
