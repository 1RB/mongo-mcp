import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema, MongoFilterSchema, MongoUpdateSchema } from '../utils/types.js';
import { formatError } from '../utils/helpers.js';

const UpdateOneSchema = BaseMongoSchema.extend({
  filter: MongoFilterSchema,
  update: MongoUpdateSchema,
  upsert: z.boolean().optional(),
  bypassDocumentValidation: z.boolean().optional(),
  comment: z.string().optional(),
});

type UpdateOneParams = z.infer<typeof UpdateOneSchema>;

export class UpdateOneTool extends BaseTool<UpdateOneParams> {
  constructor() {
    super({
      name: 'updateOne',
      description: 'Update a single document in a collection',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['write', 'update', 'modify'],
    });
  }

  get inputSchema(): z.ZodType<UpdateOneParams> {
    return UpdateOneSchema;
  }

  async execute(params: UpdateOneParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        filter,
        update,
        upsert = false,
        bypassDocumentValidation = false,
        comment,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);
      await this.validateDocument(collection, filter);

      const startTime = Date.now();
      const result = await this.db.collection(collection).updateOne(filter, update, {
        upsert,
        bypassDocumentValidation,
        comment,
      });
      const duration = Date.now() - startTime;

      if (!result.acknowledged) {
        throw new Error('Update operation was not acknowledged by the server');
      }

      return this.createSuccessResponse(
        `Successfully updated document in ${duration}ms`,
        {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId,
          metadata: {
            collection,
            duration,
            filter,
            update,
            upsert,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 