import { Collection, Document } from 'mongodb';
import { MongoFilter, MongoOptions, MongoProjection } from './types.js';

export async function formatDocuments(
  documents: Document[],
  options?: {
    pretty?: boolean;
    maxDepth?: number;
    maxArrayLength?: number;
  }
): Promise<string> {
  const { pretty = true, maxDepth = 3, maxArrayLength = 10 } = options ?? {};

  function truncateArray(arr: any[], maxLength: number): any[] {
    if (arr.length <= maxLength) return arr;
    return [...arr.slice(0, maxLength), `... ${arr.length - maxLength} more items`];
  }

  function stringifyValue(value: any, depth: number): any {
    if (depth > maxDepth) return '[Object]';
    if (Array.isArray(value)) {
      return truncateArray(value.map(v => stringifyValue(v, depth + 1)), maxArrayLength);
    }
    if (value && typeof value === 'object') {
      const obj: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = stringifyValue(v, depth + 1);
      }
      return obj;
    }
    return value;
  }

  const processed = documents.map(doc => stringifyValue(doc, 0));
  return JSON.stringify(processed, null, pretty ? 2 : 0);
}

export async function executeQuery(
  collection: Collection,
  filter: MongoFilter,
  projection?: MongoProjection,
  options?: MongoOptions
): Promise<Document[]> {
  const cursor = collection.find(filter, { projection, ...options });
  
  if (options?.sort) {
    cursor.sort(options.sort);
  }
  
  if (options?.skip) {
    cursor.skip(options.skip);
  }
  
  if (options?.limit) {
    cursor.limit(options.limit);
  }

  return cursor.toArray();
}

export function validateObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

export function sanitizeProjection(projection: Record<string, any>): MongoProjection {
  const sanitized: Record<string, number> = {};
  for (const [key, value] of Object.entries(projection)) {
    sanitized[key] = value ? 1 : 0;
  }
  return sanitized;
}

export function validateCollectionName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}

export function validateDatabaseName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}

export function validateIndexName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(2)}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(2)}h`;
} 