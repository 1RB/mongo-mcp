import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema, MongoFilterSchema } from '../utils/types.js';
import { formatError } from '../utils/helpers.js';

const DeleteOneSchema = BaseMongoSchema.extend({
  filter: MongoFilterSchema,
  comment: z.string().optional(),
  hint: z.record(z.union([z.literal(1), z.literal(-1)])).optional(),
});

type DeleteOneParams = z.infer<typeof DeleteOneSchema>;

export class DeleteOneTool extends BaseTool<DeleteOneParams> {
  constructor() {
    super({
      name: 'deleteOne',
      description: 'Delete a single document from a collection',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['write', 'delete', 'remove'],
    });
  }

  get inputSchema(): z.ZodType<DeleteOneParams> {
    return DeleteOneSchema;
  }

  async execute(params: DeleteOneParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        filter,
        comment,
        hint,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);
      await this.validateDocument(collection, filter);

      const startTime = Date.now();
      const result = await this.db.collection(collection).deleteOne(filter, {
        comment,
        hint,
      });
      const duration = Date.now() - startTime;

      if (!result.acknowledged) {
        throw new Error('Delete operation was not acknowledged by the server');
      }

      return this.createSuccessResponse(
        `Successfully deleted document in ${duration}ms`,
        {
          deletedCount: result.deletedCount,
          metadata: {
            collection,
            duration,
            filter,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 