import Joi from 'joi';

export const envValidation = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5050),
  MONGODB_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  CLIENT_URL: Joi.string().uri().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  ADMIN_EMAIL: Joi.string().email(),
  ADMIN_PASSWORD: Joi.string().min(8),
  SMTP_HOST: Joi.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string(),
  SMTP_PASS: Joi.string(),
  SENDER_EMAIL: Joi.string(),
});
