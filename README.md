# MongoDB MCP Server

A **Model Context Protocol (MCP) server** that connects to MongoDB databases. This server exposes your MongoDB data as structured resources, provides a suite of tools for querying and aggregating your data, and includes prompts to assist in data analysis. Whether you're a developer looking to integrate your database into NLP workflows or a non-developer wanting to explore your data through natural language queries, this server is designed to be accessible and powerful.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running the Server](#running-the-server)
  - [Using with Cursor (AI Code Editor)](#using-with-cursor-ai-code-editor)
  - [Using with Claude for Desktop](#using-with-claude-for-desktop)
- [Cursor-Based Pagination](#cursor-based-pagination)
- [Example Queries](#example-queries)
- [Detailed Explanation for Non-Developers](#detailed-explanation-for-non-developers)
- [Security Considerations](#security-considerations)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The MongoDB MCP Server is designed to bridge MongoDB databases and modern AI applications through the **Model Context Protocol (MCP)**. MCP standardizes how data and functionality (like tools and prompts) are exposed to large language models, enabling natural language interfaces that can seamlessly query your data.

Key benefits include:
- **Separation of Concerns:** Your database logic remains separate from how the data is served to the AI.
- **Flexible Integration:** Easily integrate with AI-powered code editors (such as Cursor) and chat interfaces (like Claude for Desktop).
- **Enhanced Data Exploration:** Navigate large datasets efficiently with cursor-based pagination.

---

## Features

### Resources
- **Collections List:** Expose all database collections.
- **Collection Schema:** Dynamically infer and display the schema of a collection by sampling documents.

### Tools
- **query-collection:** Execute customizable MongoDB queries with filters, projections, sorting, and pagination.
- **paginated-query:** Run queries with cursor-based pagination for efficient browsing of large datasets.
- **count-documents:** Count the number of documents matching a given filter.
- **distinct-values:** Retrieve unique values for a specified field.
- **aggregate:** Execute complex MongoDB aggregation pipelines.

### Prompts
- **analyze-collection:** Generate a basic analysis of a collection's schema and data.
- **assess-data-quality:** Evaluate data quality along aspects such as completeness, consistency, and accuracy.
- **generate-query:** Provide natural language assistance to generate MongoDB queries.
- **visualization-recommendations:** Suggest suitable visualization methods for your data.

---

## Installation

Follow these steps to set up the server:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/1rb/mongo-mcp.git
   cd mongo-mcp
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Build the Project:**
   ```bash
   npm run build
   ```

---

## Configuration

This server uses environment variables to configure the connection to your MongoDB database. Set the following variables as needed:

- **MONGO_URI:** MongoDB connection string (Default: `mongodb://localhost:27017`).  
  Example: `mongodb://username:password@hostname:port/database`

- **DB_NAME:** Name of your MongoDB database (Default: `myDatabase`).

You can set these in your shell before running the server.

---

## Usage

### Running the Server

1. **Set Environment Variables:**
   ```bash
   export MONGO_URI="mongodb://username:password@hostname:port/database"
   export DB_NAME="yourDatabase"
   ```

2. **Start the Server:**
   ```bash
   node build/index.js
   ```
   The server uses standard input/output (stdio) to communicate with MCP clients.

### Using with Cursor (AI Code Editor)

[Cursor](https://cursor.com) is an AI-powered code editor that supports MCP integrations through its Composer Agent feature. Here's how to set up and use the MongoDB MCP server with Cursor:

#### Adding the MongoDB MCP Server to Cursor

1. **Install Cursor:** Download from [cursor.com/download](https://cursor.com/download).

2. **Configure MCP in Cursor:**
   - Open Cursor and navigate to **Settings (⚙️) > Features > MCP**.
   - Click on the **"+ Add New MCP Server"** button.
   - Fill out the form with the following details:
     - **Name:** `mongodb` (or any name you prefer)
     - **Type:** Select `stdio` from the dropdown
     - **Command:** `node /path/to/mongo-mcp/build/index.js`
     - **Environment Variables:** (Optional) Click "Add Environment Variable" to add:
       - `MONGO_URI`: `mongodb://username:password@hostname:port/database`
       - `DB_NAME`: `yourDatabase`
   - Click **"Save"** to add the server.

3. **Verify the Server:**
   - The server should now appear in the list of MCP servers.
   - You may need to click the refresh button in the top right corner of the MCP server card to populate the tool list.
   - You should see the MongoDB tools listed under "Available Tools".

#### Project-Specific Configuration (Optional)

You can also configure project-specific MCP servers using a `.cursor/mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "node",
      "args": ["/path/to/mongo-mcp/build/index.js"],
      "env": {
        "MONGO_URI": "mongodb://username:password@hostname:port/database",
        "DB_NAME": "yourDatabase"
      }
    }
  }
}
```

#### Using MongoDB Tools with Cursor's Agent

1. **Open the Composer:** Click on the Composer tab or use the keyboard shortcut.
2. **Interact with the Agent:** The Composer Agent will automatically use the MongoDB MCP tools when relevant. You can:
   - Ask direct questions about your MongoDB data
   - Request specific analyses or queries
   - Prompt tool usage by referring to the tool by name or description

3. **Tool Approval:** 
   - By default, when the Agent wants to use an MCP tool, it will display a message asking for your approval.
   - You can expand the message to see the tool call arguments before approving.
   - For advanced users: Enable "Yolo mode" in Cursor settings to allow the Agent to run MCP tools without requiring approval (similar to terminal commands).

4. **View Tool Responses:**
   - When a tool is used, Cursor will display the response in the chat.
   - You can expand views of both the tool call arguments and the tool call response.

#### Example Queries in Cursor

```
What collections are in my MongoDB database?
Can you analyze the schema of my "users" collection?
Help me write a query to find all orders with status "completed" in the last 30 days.
Get the first page of products sorted by price in descending order.
```

The Agent will automatically map these natural language queries to the appropriate MCP tools provided by the MongoDB server.

### Using with Claude for Desktop

1. **Install Claude for Desktop:** Get it from [claude.ai/download](https://claude.ai/download).
2. **Edit the Configuration File:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
3. **Add the MongoDB MCP Server:**
   ```json
   {
     "mcpServers": {
       "mongodb": {
         "command": "node",
         "args": ["/path/to/mongo-mcp/build/index.js"],
         "env": {
           "MONGO_URI": "mongodb://username:password@hostname:port/database",
           "DB_NAME": "yourDatabase"
         }
       }
     }
   }
   ```
4. **Restart Claude for Desktop.**

After restarting, you can access the MCP server's tools through the Claude interface.

---

## Cursor-Based Pagination

Efficient navigation of large datasets is achieved via cursor-based pagination with the `paginated-query` tool.

### How It Works

- **Parameters:**
  - `collectionName`: The targeted collection.
  - `filter`: MongoDB filter criteria.
  - `sort`: Sorting configuration (required for cursor pagination).
  - `limit`: Maximum results to return (default is 20).
  - `lastId`: The ObjectId of the last document from the previous page.
  - `lastValue`: The value of the sort field from the last document.
  - `projection`: Projection object to select specific fields.

- **Workflow:**
  1. The first query is executed without `lastId` and `lastValue`.
  2. The response includes pagination metadata (cursor for the next page).
  3. Use these metadata (`lastId` and `lastValue`) in subsequent queries to retrieve the next batch.
  4. This method is more efficient than offset-based pagination.

### Example Usage

```
// First page query:
// Use the paginated-query tool to find the first 20 documents in the "orders" collection sorted by date

// Next page query (using cursor from previous response):
// Use the paginated-query tool with lastId: "60f7b0b9e6b3f83a3c9e4d8a" and lastValue: "2023-01-15T00:00:00.000Z"
```

The response includes a JSON structure with `results` and a `pagination` object containing `nextCursor` details.

### Performance Optimization Tips

- **Indexes:** Create compound indexes on the pagination field and `_id`:
  ```js
  db.collection.createIndex({ date: 1, _id: 1 })
  ```
- **Compound Sorting:** Use sorting with both the field and `_id` to guarantee consistency.
- **Bucket Pattern:** For extremely large collections, consider employing the bucket pattern ([MongoDB's Pagination Tutorial](https://www.mongodb.com/blog/post/paging-with-the-bucket-pattern--part-1)).

---

## Example Queries

- **Listing Collections:**
  ```
  What collections are available in my MongoDB database?
  ```

- **Analyzing a Collection:**
  ```
  Analyze the "users" collection in my MongoDB database.
  ```

- **Running a Query:**
  ```
  Find all documents in the "orders" collection where the total is greater than 100 and sort by date.
  ```

- **Using Cursor-Based Pagination:**
  ```
  Get the first page of 10 products sorted by price in descending order.
  ```

- **Data Quality Assessment:**
  ```
  Assess the data quality of the "products" collection.
  ```

---

## Detailed Explanation for Non-Developers

Even if you're not a developer, here's a simplified explanation of what this server does:

- **Data as Resources:** Think of your database as a library. This server lists all the books (collections) and summarizes their content (schema inference) so you know what information is available.
- **Tools for Queries:** It provides built-in tools that let you ask questions like, "How many orders did we have last month?" or "Show me all distinct product types." This is similar to using a search function on a website.
- **Natural Language Prompts:** Instead of writing complex code, you can simply ask natural language questions like, "Analyze the customer data," and the server helps generate meaningful insights.
- **Cursor-Based Pagination:** When there are many results, the server organizes the data in small batches (pages) so you can go through them page by page, which is more efficient than scrolling through millions of records all at once.
- **Integration with AI Tools:** You can connect this server with user-friendly tools like Cursor or Claude for Desktop, which allow you to interact with your data conversationally.

---

## Security Considerations

- **Read-Only Access:** This server is designed to only read data from MongoDB. No modifications to the database are allowed.
- **Environment Variables:** Sensitive information like MongoDB credentials is stored in environment variables, keeping them out of the source code.
- **Access Control:** It is recommended to use a MongoDB user account with read-only permissions to further secure your database.
- **Data Privacy:** Be cautious about exposing sensitive data. Always follow your organization's data privacy policies.

---

## Troubleshooting & FAQ

### Common Issues

- **Connection Failures:** Ensure your `MONGO_URI` and `DB_NAME` are correctly set and that MongoDB is accessible from your network.
- **Invalid ObjectId:** If you receive an "Invalid ObjectId" error, check that any pagination tokens are valid and generated by the server.
- **Pagination Problems:** Make sure the sorting parameter is consistently applied. Compound indexes can improve performance.

### FAQ

- **Q:** Can I modify the server to perform write operations?  
  **A:** Currently, the server is designed for read-only operations. For writes, you would need to customize the tool implementations.

- **Q:** How does cursor-based pagination improve performance?  
  **A:** It avoids the overhead of using skip/limit on large datasets by using a pointer (cursor) to the last document, ensuring queries remain fast even with millions of records.

---

## Contributing

Contributions are welcome! If you'd like to improve this project, please:
- Fork the repository.
- Create a feature branch.
- Submit a pull request with clear explanations of your changes.
- For major changes, consider opening an issue first to discuss your ideas.

---

## License

This project is licensed under the MIT License.

---

*For more details, refer to the [Model Context Protocol Documentation](https://modelcontextprotocol.io) and the [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk). Additional references: [MongoDB Cursor Pagination Tutorial](https://www.mongodb.com/blog/post/paging-with-the-bucket-pattern--part-1), [Mongo Cursor Pagination GitHub](https://github.com/mixmaxhq/mongo-cursor-pagination), and [Cursor MCP Documentation](https://docs.cursor.com/context/model-context-protocol).*