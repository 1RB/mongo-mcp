import { z } from 'zod';
import { Db } from 'mongodb';

export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
}

export abstract class BaseTool<T = unknown> {
  protected db: Db | null = null;
  
  constructor(protected metadata: ToolMetadata) {}

  abstract get inputSchema(): z.ZodType<T>;

  getName(): string {
    return this.metadata.name;
  }

  getDescription(): string {
    return this.metadata.description;
  }

  getVersion(): string {
    return this.metadata.version;
  }

  getCategory(): string {
    return this.metadata.category;
  }

  getTags(): string[] {
    return this.metadata.tags;
  }

  setDatabase(db: Db | null): void {
    this.db = db;
  }

  protected validateInput(input: unknown): T {
    return this.inputSchema.parse(input);
  }

  protected createSuccessResponse(text: string, data?: unknown): ToolResponse {
    return {
      content: [{
        type: 'text',
        text,
        data
      }],
      isError: false
    };
  }

  protected createErrorResponse(error: Error | string): ToolResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      content: [{
        type: 'text',
        text: errorMessage
      }],
      isError: true
    };
  }

  protected async validateCollection(collectionName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const collections = await this.db.listCollections().toArray();
    if (!collections.some(col => col.name === collectionName)) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }
  }

  protected async validateDocument(collectionName: string, filter: object): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const count = await this.db.collection(collectionName).countDocuments(filter);
    if (count === 0) {
      throw new Error('Document not found');
    }
  }

  abstract execute(params: T): Promise<ToolResponse>;
} 