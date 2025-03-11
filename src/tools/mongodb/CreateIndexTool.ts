import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema, MongoIndexSchema, MongoIndexOptionsSchema } from '../utils/types.js';
import { formatError, validateIndexName } from '../utils/helpers.js';

const CreateIndexSchema = BaseMongoSchema.extend({
  index: MongoIndexSchema,
  options: MongoIndexOptionsSchema,
});

type CreateIndexParams = z.infer<typeof CreateIndexSchema>;

export class CreateIndexTool extends BaseTool<CreateIndexParams> {
  constructor() {
    super({
      name: 'createIndex',
      description: 'Create an index on a collection',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['index', 'performance', 'optimization'],
    });
  }

  get inputSchema(): z.ZodType<CreateIndexParams> {
    return CreateIndexSchema;
  }

  async execute(params: CreateIndexParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        index,
        options = {},
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);

      // Validate index name if provided
      if (options.name && !validateIndexName(options.name)) {
        throw new Error('Invalid index name format');
      }

      const startTime = Date.now();
      const result = await this.db.collection(collection).createIndex(index, options);
      const duration = Date.now() - startTime;

      return this.createSuccessResponse(
        `Successfully created index '${result}' in ${duration}ms`,
        {
          indexName: result,
          metadata: {
            collection,
            duration,
            index,
            options,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 