import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MongoClient } from "mongodb";

// Get MongoDB URI from command line arguments or environment variable
const MONGO_URI = process.argv[2] || process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MongoDB URI must be provided as a command-line argument or MONGO_URI environment variable");
}

// Create a MongoDB client
const mongoClient = new MongoClient(MONGO_URI);

// Utility function: Infer schema by sampling one document's keys in a collection
async function inferCollectionSchema(database: string, collection: string): Promise<string> {
  try {
    const db = mongoClient.db(database);
    const coll = db.collection(collection);
    const sample = await coll.findOne();
    if (!sample) {
      return 'No documents found to infer schema.';
    }
    // List keys from the sample document
    const keys = Object.keys(sample);
    return `Inferred fields: ${keys.join(", ")}`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error inferring schema: ${error.message}`;
    }
    return 'Unknown error occurred while inferring schema';
  }
}

async function main() {
  // Connect to MongoDB
  await mongoClient.connect();

  // Create MCP server instance
  const server = new McpServer({
    name: "MongoDBServer",
    version: "1.0.0"
  });

  // Expose resource: Collection Schema
  // URI template: mongodb://{database}/{collection}/schema
  server.resource(
    "collection-schema",
    new ResourceTemplate("mongodb://{database}/{collection}/schema", { list: undefined }),
    async (uri, params) => {
      // Extract parameters and ensure they are strings
      let { database, collection } = params;
      const dbName = Array.isArray(database) ? database[0] : database;
      const collName = Array.isArray(collection) ? collection[0] : collection;
      const schemaInfo = await inferCollectionSchema(dbName, collName);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/plain",
          text: schemaInfo
        }]
      };
    }
  );

  // Expose tool: Aggregation Query
  // Input: database, collection, pipeline as a JSON string
  server.tool(
    "aggregate-query",
    {
      database: z.string(),
      collection: z.string(),
      pipeline: z.string().describe("Aggregation pipeline as a JSON string")
    },
    async ({ database, collection, pipeline }) => {
      try {
        const parsedPipeline = JSON.parse(pipeline);
        if (!Array.isArray(parsedPipeline)) {
          throw new Error("Pipeline must be a JSON array.");
        }
        const db = mongoClient.db(database);
        const coll = db.collection(collection);
        const results = await coll.aggregate(parsedPipeline).toArray();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Aggregation query error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Expose prompt: Data Analysis Task
  // Input: collection and a question
  server.prompt(
    "data-analysis",
    {
      collection: z.string(),
      question: z.string()
    },
    ({ collection, question }) => {
      // Ensure collection is string
      const dbCollection = Array.isArray(collection) ? collection[0] : collection;
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the data in the '${dbCollection}' collection.
Question: ${question}`
            }
          }
        ]
      };
    }
  );

  // Start the server using stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log status
  console.error("MongoDB MCP Server running. Connected to MongoDB at", MONGO_URI);
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 