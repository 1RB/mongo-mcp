import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema } from '../utils/types.js';
import { formatBytes, formatError } from '../utils/helpers.js';

const ListIndexesSchema = BaseMongoSchema.extend({
  includeStats: z.boolean().optional(),
  batchSize: z.number().min(1).max(1000).optional(),
  comment: z.string().optional(),
});

type ListIndexesParams = z.infer<typeof ListIndexesSchema>;

export class ListIndexesTool extends BaseTool<ListIndexesParams> {
  constructor() {
    super({
      name: 'listIndexes',
      description: 'List indexes in a collection with optional statistics',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['index', 'info', 'performance'],
    });
  }

  get inputSchema(): z.ZodType<ListIndexesParams> {
    return ListIndexesSchema;
  }

  async execute(params: ListIndexesParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        includeStats = false,
        batchSize = 100,
        comment,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);

      const startTime = Date.now();
      const cursor = this.db.collection(collection).listIndexes({
        batchSize,
        comment,
      });

      const indexes = await cursor.toArray();
      const duration = Date.now() - startTime;

      if (!includeStats) {
        return this.createSuccessResponse(
          `Found ${indexes.length} indexes:`,
          indexes.map(index => ({
            name: index.name,
            key: index.key,
            unique: index.unique || false,
            sparse: index.sparse || false,
          }))
        );
      }

      // Get detailed stats for each index
      const stats = await this.db.command({
        collStats: collection,
        scale: 1,
      });

      const indexDetails = indexes.map(index => {
        const indexStats = stats.indexSizes[index.name];
        return {
          name: index.name,
          key: index.key,
          unique: index.unique || false,
          sparse: index.sparse || false,
          size: indexStats ? formatBytes(indexStats) : 'unknown',
          properties: {
            background: index.background || false,
            partialFilterExpression: index.partialFilterExpression,
            expireAfterSeconds: index.expireAfterSeconds,
            textIndexVersion: index.textIndexVersion,
            weights: index.weights,
            default_language: index.default_language,
            language_override: index.language_override,
            collation: index.collation,
          },
        };
      });

      return this.createSuccessResponse(
        `Found ${indexes.length} indexes with statistics:`,
        {
          indexes: indexDetails,
          metadata: {
            collection,
            duration,
            totalIndexSize: formatBytes(stats.totalIndexSize),
            avgIndexSize: formatBytes(stats.totalIndexSize / indexes.length),
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 