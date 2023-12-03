import * as Joi from 'joi';

const NewProduct = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().integer().positive().required(),
  count: Joi.number().integer().positive().required(),
});

export { NewProduct };