const Joi = require("joi");

const phoneSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^\+?[0-9]{8,15}$/).required()
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^\+?[0-9]{8,15}$/).required(),
  otp: Joi.string().trim().length(6).required()
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).optional(),
  email: Joi.string().email().optional()
}).min(1);

const addressCreateSchema = Joi.object({
  line1: Joi.string().required(),
  line2: Joi.string().allow("", null),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
  is_default: Joi.boolean().optional()
});

const addressUpdateSchema = Joi.object({
  line1: Joi.string(),
  line2: Joi.string().allow("", null),
  city: Joi.string(),
  state: Joi.string(),
  pincode: Joi.string(),
  is_default: Joi.boolean()
}).min(1);

module.exports = {
  phoneSchema,
  verifyOtpSchema,
  refreshSchema,
  updateProfileSchema,
  addressCreateSchema,
  addressUpdateSchema
};
