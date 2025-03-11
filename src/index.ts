#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient, Db } from "mongodb";
import { z } from "zod";

// Import tools
import { ListCollectionsTool } from "./tools/mongodb/ListCollectionsTool.js";
import { FindTool } from "./tools/mongodb/FindTool.js";
import { InsertOneTool } from "./tools/mongodb/InsertOneTool.js";
import { UpdateOneTool } from "./tools/mongodb/UpdateOneTool.js";
import { DeleteOneTool } from "./tools/mongodb/DeleteOneTool.js";
import { CreateIndexTool } from "./tools/mongodb/CreateIndexTool.js";
import { DropIndexTool } from "./tools/mongodb/DropIndexTool.js";
import { ListIndexesTool } from "./tools/mongodb/ListIndexesTool.js";

// Define environment variable schema using zod
const EnvSchema = z.object({
  MONGO_URI: z.string().optional(),
  MONGO_DB_NAME: z.string().default('test'),
  MONGO_MAX_POOL_SIZE: z.coerce.number().default(10),
  MONGO_ALLOWED_DATABASES: z.string().optional().transform(val => val ? val.split(',') : undefined),
  MONGO_ALLOWED_COLLECTIONS: z.string().optional().transform(val => val ? val.split(',') : undefined),
  DEBUG: z.string().optional().transform(val => val === 'true'),
});

// Client and DB variables
let client: MongoClient;
let db: Db;

// Connect to MongoDB
async function connectToMongoDB(databaseUrl: string): Promise<Db> {
  try {
    // Get database name from connection URL if possible
    const dbName = process.env.MONGO_DB_NAME || 'test';
    const env = EnvSchema.parse(process.env);
    
    // MongoDB connection options
    const options = {
      maxPoolSize: env.MONGO_MAX_POOL_SIZE,
    };

    client = new MongoClient(databaseUrl, options);
    await client.connect();
    
    db = client.db(dbName);
    
    if (env.DEBUG) {
      console.error(`Connected to MongoDB database: ${dbName}`);
    }
    
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Cleanup function to close MongoDB connection
async function closeMongoDB() {
  if (client) {
    try {
      await client.close();
      if (EnvSchema.parse(process.env).DEBUG) {
        console.error("MongoDB connection closed");
      }
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
}

async function main() {
  try {
    // Get MongoDB URI from command line argument or env variable
    const mongoUri = process.argv[2] || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error("MongoDB URI is required. Please provide it as a command line argument or set the MONGO_URI environment variable.");
      process.exit(1);
    }
    
    // Connect to MongoDB
    db = await connectToMongoDB(mongoUri);
    
    const env = EnvSchema.parse(process.env);
    
    // Initialize MCP server
    const server = new Server(
      {
        name: "MongoDB MCP Server",
        version: "1.0.2"
      },
      {
        capabilities: {
          resources: {},
          tools: {
            list: true,
            call: true,
          },
        },
      }
    );
    
    // Create tools
    const tools = [
      new ListCollectionsTool(),
      new FindTool(),
      new InsertOneTool(),
      new UpdateOneTool(),
      new DeleteOneTool(),
      new CreateIndexTool(),
      new DropIndexTool(),
      new ListIndexesTool(),
    ];
    
    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Get schemas from all tools
      const schemas = tools.map(tool => ({
        name: tool.getName(),
        description: tool.getDescription(),
        inputSchema: tool.inputSchema,
      }));
      
      return { tools: schemas, _meta: {} };
    });
    
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const name = request.params.name;
      const args = request.params.arguments ?? {};
      
      // Check database and collection access based on env vars
      if (args && typeof args === 'object' && 'collection' in args) {
        const collection = String(args.collection || "");
        
        // Check if collection is allowed
        if (env.MONGO_ALLOWED_COLLECTIONS && 
            !env.MONGO_ALLOWED_COLLECTIONS.includes(collection)) {
          return { 
            toolResult: {
              content: [
                {
                  type: "text",
                  text: `Access to collection '${collection}' is not allowed`
                }
              ],
              isError: true
            }
          };
        }
      }
      
      // Create tool map
      const toolMap = {
        "mcp__listCollections": new ListCollectionsTool(),
        "mcp__find": new FindTool(),
        "mcp__insertOne": new InsertOneTool(),
        "mcp__updateOne": new UpdateOneTool(),
        "mcp__deleteOne": new DeleteOneTool(),
        "mcp__createIndex": new CreateIndexTool(),
        "mcp__dropIndex": new DropIndexTool(),
        "mcp__indexes": new ListIndexesTool(),
      };
      
      const tool = toolMap[name as keyof typeof toolMap];
      
      if (!tool) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Tool '${name}' not found`
              }
            ],
            isError: true
          }
        };
      }
      
      try {
        // Execute the tool
        // Ensure args has the required collection property for tools that need it
        if (name.includes('find') || name.includes('insert') || name.includes('update') || 
            name.includes('delete') || name.includes('createIndex') || name.includes('dropIndex') || 
            name.includes('indexes')) {
          // Make sure collection is set if not already
          if (!args.collection) {
            return { 
              toolResult: {
                content: [
                  {
                    type: "text",
                    text: `Collection name is required for tool '${name}'`
                  }
                ],
                isError: true
              }
            };
          }
        }
        
        const result = await tool.execute(args as any);
        return { toolResult: result };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return { 
          toolResult: {
            content: [
              {
                type: "text",
                text: error instanceof Error ? error.message : String(error)
              }
            ],
            isError: true
          }
        };
      }
    });
    
    // Set up transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("MongoDB MCP server running on stdio");
    
    // Set up process handlers for cleanup
    process.on('SIGINT', async () => {
      await closeMongoDB();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await closeMongoDB();
      process.exit(0);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 