const { Joi } = require("express-validation");

module.exports = {
  // POST /v1/auth/login
  login: {
    body: Joi.object({
      email: Joi.string().email(),
      code: Joi.string().min(6).max(6),
      type: Joi.string().valid("email", "google").default("email").required(),
      access_token: Joi.string().default(null),
    }),
  },
  otp: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },
  profile: {
    body: Joi.object({
      name: Joi.string().required(),
      profilePicture: Joi.string(),
      bio: Joi.string(),
      phone: Joi.string(),
      password: Joi.string(),
      accoutType: Joi.string(),
    }),
  },
};
