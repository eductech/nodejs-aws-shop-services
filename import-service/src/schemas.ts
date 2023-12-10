import * as Joi from 'joi';

const NewImport = Joi.object({
  name: Joi.string().required(),
});

export { NewImport };