import { z } from 'zod';
import { BaseTool, ToolResponse } from '../base/BaseTool.js';
import { BaseMongoSchema, MongoFilterSchema, MongoOptionsSchema, MongoProjectionSchema } from '../utils/types.js';
import { executeQuery, formatDocuments, formatError } from '../utils/helpers.js';

const FindSchema = BaseMongoSchema.extend({
  filter: MongoFilterSchema.optional(),
  projection: MongoProjectionSchema.optional(),
  options: MongoOptionsSchema,
  pretty: z.boolean().optional(),
  maxDepth: z.number().min(1).max(10).optional(),
  maxArrayLength: z.number().min(1).max(100).optional(),
});

type FindParams = z.infer<typeof FindSchema>;

export class FindTool extends BaseTool<FindParams> {
  constructor() {
    super({
      name: 'find',
      description: 'Find documents in a collection with advanced filtering and formatting options',
      version: '1.0.0',
      category: 'MongoDB',
      tags: ['query', 'search', 'filter'],
    });
  }

  get inputSchema(): z.ZodType<FindParams> {
    return FindSchema;
  }

  async execute(params: FindParams): Promise<ToolResponse> {
    try {
      const {
        collection,
        filter = {},
        projection,
        options = {},
        pretty = true,
        maxDepth = 3,
        maxArrayLength = 10,
      } = this.validateInput(params);

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.validateCollection(collection);

      const startTime = Date.now();
      const documents = await executeQuery(
        this.db.collection(collection),
        filter,
        projection,
        options
      );
      const duration = Date.now() - startTime;

      if (documents.length === 0) {
        return this.createSuccessResponse('No documents found matching the criteria.');
      }

      const formattedDocs = await formatDocuments(documents, {
        pretty,
        maxDepth,
        maxArrayLength,
      });

      return this.createSuccessResponse(
        `Found ${documents.length} document(s) in ${duration}ms:`,
        {
          documents: JSON.parse(formattedDocs),
          metadata: {
            count: documents.length,
            duration,
            collection,
            filter,
            projection,
            options,
          },
        }
      );
    } catch (error) {
      return this.createErrorResponse(formatError(error));
    }
  }
} 