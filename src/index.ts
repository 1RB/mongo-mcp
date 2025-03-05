import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";

// =============================================
// Configuration
// =============================================

// MongoDB connection string - this should be provided as an environment variable
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "myDatabase";
const MAX_SAMPLE_DOCS = 10; // Maximum number of documents to sample for schema inference
const DEFAULT_PAGE_SIZE = 20; // Default page size for pagination

// Create MCP server
const server = new McpServer({
  name: "mongodb-server",
  version: "1.0.0",
});

// =============================================
// MongoDB Connection Management
// =============================================

// MongoDB client
let mongoClient: MongoClient | null = null;
let isShuttingDown = false;

// Connect to MongoDB
async function connectToMongo() {
  if (mongoClient) return mongoClient;
  
  try {
    console.error(`Connecting to MongoDB at ${MONGO_URI}...`);
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    console.error(`Connected to MongoDB successfully (database: ${DB_NAME})`);
    return mongoClient;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Get database
async function getDb() {
  const client = await connectToMongo();
  return client.db(DB_NAME);
}

// Close MongoDB connection
async function closeMongo() {
  if (mongoClient) {
    try {
      await mongoClient.close();
      console.error("MongoDB connection closed");
      mongoClient = null;
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
}

// =============================================
// Helper Functions
// =============================================

// Helper function to infer schema from sample documents
function inferSchema(documents: any[]) {
  if (documents.length === 0) {
    return { message: "No documents found to infer schema" };
  }
  
  // Combine all document keys
  const schema: Record<string, string[]> = {};
  
  for (const doc of documents) {
    for (const [key, value] of Object.entries(doc)) {
      if (!schema[key]) {
        schema[key] = [];
      }
      
      const type = value instanceof ObjectId ? "ObjectId" : 
                  Array.isArray(value) ? "Array" : 
                  value === null ? "null" : 
                  typeof value;
      
      if (!schema[key].includes(type)) {
        schema[key].push(type);
      }
    }
  }
  
  return schema;
}

// Helper function to safely convert string to ObjectId
function safeObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error(`Invalid ObjectId: ${id}`);
    return null;
  }
}

// Helper function to format error messages
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// =============================================
// Resources
// =============================================

// List all collections in the database
server.resource(
  "collections",
  "mongodb://collections",
  async (uri) => {
    try {
      const db = await getDb();
      const collections = await db.listCollections().toArray();
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(collections.map(c => c.name), null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error("Error listing collections:", error);
      throw error;
    }
  }
);

// Get schema for a specific collection
server.resource(
  "collection-schema",
  new ResourceTemplate("mongodb://collections/{collectionName}/schema", { list: undefined }),
  async (uri, variables) => {
    try {
      const db = await getDb();
      const collectionName = variables.collectionName as string;
      
      // Sample a few documents to infer schema
      const sample = await db.collection(collectionName).find().limit(MAX_SAMPLE_DOCS).toArray();
      
      // Create a simple schema representation
      const schema = inferSchema(sample);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(schema, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error(`Error getting schema for collection ${variables.collectionName}:`, error);
      throw error;
    }
  }
);

// =============================================
// Tools
// =============================================

// Tool to run a MongoDB query
server.tool(
  "query-collection",
  "Run a MongoDB query on a collection",
  {
    collectionName: z.string().describe("Name of the collection to query"),
    filter: z.any().describe("MongoDB query filter (JSON object)"),
    projection: z.any().optional().describe("Fields to include/exclude (JSON object)"),
    limit: z.number().optional().describe("Maximum number of documents to return"),
    skip: z.number().optional().describe("Number of documents to skip"),
    sort: z.any().optional().describe("Sort specification (JSON object)")
  },
  async ({ collectionName, filter, projection, limit, skip, sort }) => {
    try {
      const db = await getDb();
      const collection = db.collection(collectionName);
      
      let query = collection.find(filter);
      
      if (projection) {
        query = query.project(projection);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      if (skip) {
        query = query.skip(skip);
      }
      
      if (sort) {
        query = query.sort(sort);
      }
      
      const results = await query.toArray();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error querying collection ${collectionName}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error querying collection: ${formatError(error)}`
          }
        ]
      };
    }
  }
);

// Tool to run a MongoDB query with cursor-based pagination
server.tool(
  "paginated-query",
  "Run a MongoDB query with cursor-based pagination",
  {
    collectionName: z.string().describe("Name of the collection to query"),
    filter: z.any().describe("MongoDB query filter (JSON object)"),
    sort: z.any().describe("Sort specification (JSON object)"),
    limit: z.number().optional().default(DEFAULT_PAGE_SIZE).describe("Maximum number of documents to return"),
    lastId: z.string().optional().describe("ObjectId of the last document from previous page"),
    lastValue: z.any().optional().describe("Value of the sort field from the last document of previous page"),
    projection: z.any().optional().describe("Fields to include/exclude (JSON object)")
  },
  async ({ collectionName, filter, sort, limit = DEFAULT_PAGE_SIZE, lastId, lastValue, projection }) => {
    try {
      const db = await getDb();
      const collection = db.collection(collectionName);
      
      // Create a copy of the filter
      let paginatedFilter = { ...filter };
      
      // If we have a lastId and lastValue, add cursor-based conditions
      if (lastId && lastValue) {
        // Get the first sort field (assuming sort is an object like { field: 1 })
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField]; // 1 for ascending, -1 for descending
        
        const objectId = safeObjectId(lastId);
        if (!objectId) {
          return {
            isError: true,
            content: [{ type: "text", text: `Invalid ObjectId format: ${lastId}` }]
          };
        }
        
        // Create the cursor condition based on sort order
        if (sortOrder === 1) {
          // For ascending sort
          paginatedFilter = {
            $and: [
              paginatedFilter,
              {
                $or: [
                  { [sortField]: { $gt: lastValue } },
                  {
                    $and: [
                      { [sortField]: lastValue },
                      { _id: { $gt: objectId } }
                    ]
                  }
                ]
              }
            ]
          };
        } else {
          // For descending sort
          paginatedFilter = {
            $and: [
              paginatedFilter,
              {
                $or: [
                  { [sortField]: { $lt: lastValue } },
                  {
                    $and: [
                      { [sortField]: lastValue },
                      { _id: { $lt: objectId } }
                    ]
                  }
                ]
              }
            ]
          };
        }
      }
      
      // Execute the query with the pagination filter
      let query = collection.find(paginatedFilter);
      
      // Apply sort
      query = query.sort(sort);
      
      // Apply projection if provided
      if (projection) {
        query = query.project(projection);
      }
      
      // Apply limit (add 1 to check if there are more results)
      query = query.limit(limit + 1);
      
      // Get the results
      const results = await query.toArray();
      
      // Check if there are more results
      const hasMore = results.length > limit;
      
      // Remove the extra document we fetched to check for more results
      if (hasMore) {
        results.pop();
      }
      
      // Get pagination metadata
      const lastDocument = results.length > 0 ? results[results.length - 1] : null;
      
      // Prepare pagination info for the next query
      let paginationInfo = null;
      if (lastDocument && hasMore) {
        const sortField = Object.keys(sort)[0];
        paginationInfo = {
          lastId: lastDocument._id.toString(),
          lastValue: lastDocument[sortField],
          nextCursorQuery: `Use lastId: "${lastDocument._id.toString()}" and lastValue: ${JSON.stringify(lastDocument[sortField])}`
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              results,
              pagination: {
                hasMore,
                count: results.length,
                nextCursor: paginationInfo
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error executing paginated query on collection ${collectionName}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error executing paginated query: ${formatError(error)}`
          }
        ]
      };
    }
  }
);

// Tool to count documents in a collection
server.tool(
  "count-documents",
  "Count documents in a collection based on a filter",
  {
    collectionName: z.string().describe("Name of the collection"),
    filter: z.any().optional().describe("MongoDB query filter (JSON object)")
  },
  async ({ collectionName, filter = {} }) => {
    try {
      const db = await getDb();
      const count = await db.collection(collectionName).countDocuments(filter);
      
      return {
        content: [
          {
            type: "text",
            text: String(count)
          }
        ]
      };
    } catch (error) {
      console.error(`Error counting documents in collection ${collectionName}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error counting documents: ${formatError(error)}`
          }
        ]
      };
    }
  }
);

// Tool to get distinct values for a field
server.tool(
  "distinct-values",
  "Get distinct values for a field in a collection",
  {
    collectionName: z.string().describe("Name of the collection"),
    field: z.string().describe("Field name to get distinct values for"),
    filter: z.any().optional().describe("MongoDB query filter (JSON object)")
  },
  async ({ collectionName, field, filter = {} }) => {
    try {
      const db = await getDb();
      const values = await db.collection(collectionName).distinct(field, filter);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(values, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error getting distinct values for field ${field} in collection ${collectionName}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting distinct values: ${formatError(error)}`
          }
        ]
      };
    }
  }
);

// Tool to run aggregation pipeline
server.tool(
  "aggregate",
  "Run an aggregation pipeline on a collection",
  {
    collectionName: z.string().describe("Name of the collection"),
    pipeline: z.array(z.any()).describe("MongoDB aggregation pipeline (array of stages)")
  },
  async ({ collectionName, pipeline }) => {
    try {
      const db = await getDb();
      const results = await db.collection(collectionName).aggregate(pipeline).toArray();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error running aggregation on collection ${collectionName}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error running aggregation: ${formatError(error)}`
          }
        ]
      };
    }
  }
);

// =============================================
// Prompts
// =============================================

// Prompt for basic data analysis
server.prompt(
  "analyze-collection",
  "Generate a basic analysis of a MongoDB collection",
  {
    collectionName: z.string().describe("Name of the collection to analyze")
  },
  async ({ collectionName }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze the MongoDB collection "${collectionName}". 
            
First, examine its schema to understand the data structure. Then, provide insights on:
1. The key fields and their data types
2. Potential relationships with other collections
3. Suggested queries for common analytics tasks
4. Recommendations for indexing or optimization

You can use the following MCP tools:
- query-collection: To query documents from the collection
- count-documents: To count documents matching criteria
- distinct-values: To find unique values for a field
- aggregate: To run aggregation pipelines for analytics

Start by examining the schema using the collection-schema resource.`
          }
        }
      ]
    };
  }
);

// Prompt for data quality assessment
server.prompt(
  "assess-data-quality",
  "Assess the quality of data in a MongoDB collection",
  {
    collectionName: z.string().describe("Name of the collection to assess")
  },
  async ({ collectionName }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please assess the data quality in the MongoDB collection "${collectionName}".
            
Analyze the following aspects:
1. Completeness: Check for missing values in important fields
2. Consistency: Look for inconsistent formats or values
3. Accuracy: Identify potential outliers or suspicious values
4. Timeliness: If timestamp fields exist, check for recency
5. Uniqueness: Check for duplicate records

Use the MCP tools to gather the necessary information:
- query-collection: To sample documents
- count-documents: To count null/missing values
- distinct-values: To check value distributions
- aggregate: For more complex quality checks

Start by examining the schema and then sample some documents to assess quality.`
          }
        }
      ]
    };
  }
);

// Prompt for generating MongoDB queries
server.prompt(
  "generate-query",
  "Generate MongoDB queries for common scenarios",
  {
    collectionName: z.string().describe("Name of the collection"),
    scenario: z.string().describe("Description of the query scenario")
  },
  async ({ collectionName, scenario }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please help me generate MongoDB queries for the collection "${collectionName}" based on this scenario: "${scenario}".
            
First, examine the collection's schema to understand its structure. Then:
1. Generate the appropriate MongoDB query for the described scenario
2. Explain how the query works
3. Suggest any indexes that might improve performance
4. Provide alternative approaches if applicable

Use the MCP tools to test your query:
- query-collection: To run the query and verify results
- count-documents: To check result counts
- aggregate: For more complex analytical queries

Start by examining the schema using the collection-schema resource.`
          }
        }
      ]
    };
  }
);

// Prompt for data visualization recommendations
server.prompt(
  "visualization-recommendations",
  "Get recommendations for visualizing MongoDB data",
  {
    collectionName: z.string().describe("Name of the collection to visualize")
  },
  async ({ collectionName }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please provide recommendations for visualizing data from the MongoDB collection "${collectionName}".
            
First, examine the collection's schema and sample data. Then suggest:
1. Appropriate chart types for different fields (bar charts, line charts, etc.)
2. Key metrics and dimensions that would be insightful to visualize
3. Aggregation queries that would prepare the data for visualization
4. Tools or libraries that would be suitable for implementing these visualizations

Use the MCP tools to explore the data:
- query-collection: To sample documents
- distinct-values: To understand value distributions
- aggregate: To test aggregation pipelines for visualization data

Start by examining the schema using the collection-schema resource.`
          }
        }
      ]
    };
  }
);

// =============================================
// Server Startup and Shutdown
// =============================================

// Start the server
async function main() {
  try {
    // Connect to MongoDB first
    await connectToMongo();
    
    // Start the MCP server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("MongoDB MCP Server running on stdio");
    
    // Log server startup information (using console.error instead of loggingNotification)
    console.error(`MongoDB MCP Server connected to ${DB_NAME} at ${MONGO_URI}`);
  } catch (error) {
    console.error("Error starting server:", error);
    await closeMongo();
    process.exit(1);
  }
}

// Graceful shutdown function
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.error("Shutting down...");
  await closeMongo();
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
  // Don't exit the process, just log the error
});

// Run the server
main().catch(error => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
