import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema } from '../utils/types.js';
import { formatError } from '../utils/helpers.js';

const InsertOneSchema = BaseMongoSchema.extend({
  document: z.record(z.unknown()),
  bypassDocumentValidation: z.boolean().optional(),
  comment: z.string().optional(),
});

type InsertOneParams = z.infer<typeof InsertOneSchema>;

export class InsertOneTool extends BaseTool<InsertOneParams> {
  constructor() {
    super({
      name: 'insertOne',
      description: 'Insert a single document into a collection',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['write', 'insert', 'create'],
    });
  }

  get inputSchema(): z.ZodType<InsertOneParams> {
    return InsertOneSchema;
  }

  async execute(params: InsertOneParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        document,
        bypassDocumentValidation = false,
        comment,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);

      const startTime = Date.now();
      const result = await this.db.collection(collection).insertOne(document, {
        bypassDocumentValidation,
        comment,
      });
      const duration = Date.now() - startTime;

      if (!result.acknowledged) {
        throw new Error('Insert operation was not acknowledged by the server');
      }

      return this.createSuccessResponse(
        `Successfully inserted document in ${duration}ms`,
        {
          insertedId: result.insertedId,
          metadata: {
            collection,
            duration,
            document,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 