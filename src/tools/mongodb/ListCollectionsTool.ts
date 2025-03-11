import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema } from '../utils/types.js';
import { formatBytes, formatError } from '../utils/helpers.js';
import { CollectionInfo } from 'mongodb';

interface CollectionStats {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  indexes: number;
  totalIndexSize: number;
  scaleFactor: number;
}

const ListCollectionsSchema = BaseMongoSchema.extend({
  database: z.string().optional(),
  nameOnly: z.boolean().optional(),
  includeStats: z.boolean().optional(),
  filter: z.record(z.unknown()).optional(),
});

type ListCollectionsParams = z.infer<typeof ListCollectionsSchema>;

export class ListCollectionsTool extends BaseTool<ListCollectionsParams> {
  constructor() {
    super({
      name: 'listCollections',
      description: 'List collections in the database with optional statistics',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['collections', 'stats', 'info'],
    });
  }

  get inputSchema(): z.ZodType<ListCollectionsParams> {
    return ListCollectionsSchema;
  }

  async execute(params: ListCollectionsParams): Promise<ToolResponse> {
    try {
      const { database, nameOnly = false, includeStats = false, filter = {} } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      // Get the target database
      const targetDb = database ? (this.db as any).client.db(database) : this.db;
      const collections = await targetDb.listCollections(filter).toArray() as CollectionInfo[];

      if (nameOnly) {
        return this.createSuccessResponse(
          `Found ${collections.length} collections:`,
          collections.map((c: CollectionInfo) => c.name)
        );
      }

      if (!includeStats) {
        return this.createSuccessResponse(
          `Found ${collections.length} collections:`,
          collections.map((c: CollectionInfo) => ({
            name: c.name,
            type: c.type,
            options: c.options,
          }))
        );
      }

      // Get detailed stats for each collection
      const stats: CollectionStats[] = [];
      for (const col of collections) {
        try {
          const collStats = await targetDb.collection(col.name).stats();
          stats.push({
            name: col.name,
            count: collStats.count,
            size: collStats.size,
            avgObjSize: collStats.avgObjSize,
            storageSize: collStats.storageSize,
            indexes: collStats.nindexes,
            totalIndexSize: collStats.totalIndexSize,
            scaleFactor: collStats.scaleFactor,
          });
        } catch (error) {
          console.error(`Failed to get stats for collection ${col.name}:`, error);
        }
      }

      // Format the response with detailed statistics
      const formattedStats = stats.map(stat => ({
        name: stat.name,
        documentCount: stat.count,
        size: formatBytes(stat.size),
        avgObjectSize: formatBytes(stat.avgObjSize),
        storageSize: formatBytes(stat.storageSize),
        indexes: stat.indexes,
        totalIndexSize: formatBytes(stat.totalIndexSize),
        scaleFactor: stat.scaleFactor,
      }));

      return this.createSuccessResponse(
        `Found ${collections.length} collections with statistics:`,
        formattedStats
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 