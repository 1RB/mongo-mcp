import { z } from 'zod';

export const MongoQueryOperators = {
  comparison: ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'],
  logical: ['$and', '$not', '$nor', '$or'],
  array: ['$all', '$elemMatch', '$size'],
  element: ['$exists', '$type'],
  evaluation: ['$expr', '$jsonSchema', '$mod', '$regex', '$text', '$where'],
  field: ['$currentDate', '$inc', '$min', '$max', '$mul', '$rename', '$set', '$setOnInsert', '$unset']
} as const;

export const BaseMongoSchema = z.object({
  database: z.string().optional(),
  collection: z.string(),
});

export const MongoFilterSchema = z.record(z.unknown()).or(z.array(z.record(z.unknown())));
export const MongoUpdateSchema = z.record(z.unknown());
export const MongoProjectionSchema = z.record(z.boolean().or(z.number()));
export const MongoOptionsSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  skip: z.number().min(0).optional(),
  sort: z.record(z.union([z.literal(1), z.literal(-1)])).optional(),
}).optional();

export const MongoIndexSchema = z.record(z.union([z.literal(1), z.literal(-1)]));
export const MongoIndexOptionsSchema = z.object({
  unique: z.boolean().optional(),
  sparse: z.boolean().optional(),
  background: z.boolean().optional(),
  expireAfterSeconds: z.number().optional(),
  name: z.string().optional(),
}).optional();

export type MongoFilter = z.infer<typeof MongoFilterSchema>;
export type MongoUpdate = z.infer<typeof MongoUpdateSchema>;
export type MongoProjection = z.infer<typeof MongoProjectionSchema>;
export type MongoOptions = z.infer<typeof MongoOptionsSchema>;
export type MongoIndex = z.infer<typeof MongoIndexSchema>;
export type MongoIndexOptions = z.infer<typeof MongoIndexOptionsSchema>; 