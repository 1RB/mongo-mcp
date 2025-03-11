import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema } from '../utils/types.js';
import { formatError, validateIndexName } from '../utils/helpers.js';

const DropIndexSchema = BaseMongoSchema.extend({
  indexName: z.string(),
  maxTimeMS: z.number().optional(),
  comment: z.string().optional(),
});

type DropIndexParams = z.infer<typeof DropIndexSchema>;

export class DropIndexTool extends BaseTool<DropIndexParams> {
  constructor() {
    super({
      name: 'dropIndex',
      description: 'Drop an index from a collection',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['index', 'performance', 'optimization'],
    });
  }

  get inputSchema(): z.ZodType<DropIndexParams> {
    return DropIndexSchema;
  }

  async execute(params: DropIndexParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        indexName,
        maxTimeMS,
        comment,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);

      if (!validateIndexName(indexName)) {
        throw new Error('Invalid index name format');
      }

      // Check if index exists
      const indexes = await this.db.collection(collection).listIndexes().toArray();
      const indexExists = indexes.some(index => index.name === indexName);

      if (!indexExists) {
        throw new Error(`Index '${indexName}' does not exist on collection '${collection}'`);
      }

      const startTime = Date.now();
      const result = await this.db.collection(collection).dropIndex(indexName, {
        maxTimeMS,
        comment,
      });
      const duration = Date.now() - startTime;

      if (!result.ok) {
        throw new Error(`Failed to drop index: ${result.errmsg}`);
      }

      return this.createSuccessResponse(
        `Successfully dropped index '${indexName}' in ${duration}ms`,
        {
          metadata: {
            collection,
            duration,
            indexName,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 