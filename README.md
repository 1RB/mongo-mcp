# 🗄️ MongoDB MCP Server for LLMS

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40coderay%2Fmongo-mcp-server.svg)](https://www.npmjs.com/package/@coderay/mongo-mcp-server)
[![smithery badge](https://smithery.ai/badge/mongo-mcp)](https://smithery.ai/server/mongo-mcp)

A Model Context Protocol (MCP) server that enables LLMs to interact directly with MongoDB databases. Query collections, inspect schemas, and manage data seamlessly through natural language.

## 📚 What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that creates a universal way for AI systems to connect with external data sources and tools. MCP establishes a standardized communication channel between:

- **MCP Clients**: AI assistants like Claude that consume data (e.g., Claude Desktop, Cursor.ai)
- **MCP Servers**: Services that expose data and functionality (like this MongoDB server)

Key benefits of MCP:
- **Universal Access**: Provides a single protocol for AI assistants to query data from various sources
- **Standardized Connections**: Handles authentication, usage policies, and data formats consistently
- **Sustainable Ecosystem**: Promotes reusable connectors that work across multiple LLM clients

## ✨ Features

- 🔍 Collection schema inspection
- 📊 Document querying and filtering
- 📈 Index management
- 📝 Document operations (insert, update, delete)
- 🔒 Secure database access through connection strings
- 📋 Comprehensive error handling and validation

## 📋 Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) instance (local or remote)
- An MCP client like [Claude Desktop](https://claude.ai/download) or [Cursor.ai](https://cursor.sh/)

You can verify your Node.js installation by running:
```bash
node --version  # Should show v18.0.0 or higher
```

## 🚀 Quick Start

To get started, find your MongoDB connection URL and add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": [
        "mongo-mcp",
        "mongodb://<username>:<password>@<host>:<port>/<database>?authSource=admin"
      ]
    }
  }
}
```

### Installing via Smithery

[Smithery.ai](https://smithery.ai) is a registry platform for MCP servers that simplifies discovery and installation. To install MongoDB MCP Server for Claude Desktop automatically via Smithery:

```bash
npx -y @smithery/cli install mongo-mcp --client claude
```

### Cursor.ai Integration

To use MongoDB MCP with Cursor.ai:

1. Open Cursor.ai and navigate to Settings > Features
2. Look for "MCP Servers" in the features panel
3. Add a new MCP server with the following configuration:
   - **Name**: `mongodb`
   - **Command**: `npx`
   - **Args**: `mongo-mcp mongodb://<username>:<password>@<host>:<port>/<database>?authSource=admin`

*Note: Cursor currently supports MCP tools only in the Agent in Composer feature.*

### Test Sandbox Setup

If you don't have a MongoDB server to connect to and want to create a sample sandbox, follow these steps:

1. Start MongoDB using Docker Compose:

```bash
docker-compose up -d
```

2. Seed the database with test data:

```bash
npm run seed
```

### Configure Claude Desktop

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### Local Development Mode:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "node",
      "args": [
        "dist/index.js",
        "mongodb://root:example@localhost:27017/test?authSource=admin"
      ]
    }
  }
}
```

### Test Sandbox Data Structure

The seed script creates three collections with sample data:

#### Users

- Personal info (name, email, age)
- Nested address with coordinates
- Arrays of interests
- Membership dates

#### Products

- Product details (name, SKU, category)
- Nested specifications
- Price and inventory info
- Tags and ratings

#### Orders

- Order details with items
- User references
- Shipping and payment info
- Status tracking

## 🎯 Example Prompts

Try these prompts with Claude to explore the functionality:

### Basic Operations

```
"What collections are available in the database?"
"Show me the schema for the users collection"
"Find all users in San Francisco"
```

### Advanced Queries

```
"Find all electronics products that are in stock and cost less than $1000"
"Show me all orders from the user john@example.com"
"List the products with ratings above 4.5"
```

### Index Management

```
"What indexes exist on the users collection?"
"Create an index on the products collection for the 'category' field"
"List all indexes across all collections"
```

### Document Operations

```
"Insert a new product with name 'Gaming Laptop' in the products collection"
"Update the status of order with ID X to 'shipped'"
"Find and delete all products that are out of stock"
```

## 📝 Available Tools

The server provides these tools for database interaction:

### Query Tools

- `listCollections`: Lists available collections in the database
- `find`: Queries documents with filtering and projection
- `insertOne`: Inserts a single document into a collection
- `updateOne`: Updates a single document in a collection
- `deleteOne`: Deletes a single document from a collection

### Index Tools

- `createIndex`: Creates a new index on a collection
- `dropIndex`: Removes an index from a collection
- `indexes`: Lists indexes for a collection

## 🛠️ Development

This project is built with:

- TypeScript for type-safe development
- MongoDB Node.js driver for database operations
- Zod for schema validation
- Model Context Protocol SDK for server implementation

To set up the development environment:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## 🔒 Security Considerations

When using this MCP server with your MongoDB database:

1. **Create a dedicated MongoDB user** with minimal permissions needed for your use case
2. **Never use admin credentials** in production environments
3. **Enable access logging** for audit purposes
4. **Set appropriate read/write permissions** on collections
5. **Use connection string parameters** to restrict access (e.g., `readPreference=secondary`)
6. **Consider IP allow-listing** to restrict database access

⚠️ **IMPORTANT**: Always follow the principle of least privilege when configuring database access.

## 🌐 How It Works

The MongoDB MCP server:

1. Connects to your MongoDB database using the connection string provided
2. Exposes MongoDB operations as tools that follow the MCP specification
3. Validates inputs using Zod for type safety and security
4. Executes queries and returns structured data to the LLM client
5. Manages connection pooling and proper error handling

All operations are executed with proper validation to prevent security issues such as injection attacks.

## 📦 Deployment

You can deploy this MCP server in several ways:

- Locally via npx (as shown in Quick Start)
- As a global npm package: `npm install -g @coderay/mongo-mcp-server`
- In a Docker container (see Dockerfile in the repository)
- As a service on platforms like Heroku, Vercel, or AWS

## ❓ Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify your MongoDB connection string is correct
   - Check that your MongoDB server is running and accessible
   - Ensure network permissions allow the connection

2. **Authentication Issues**
   - Confirm username and password are correct
   - Verify the authentication database is specified (usually `authSource=admin`)
   - Check if MongoDB requires TLS/SSL connections

3. **Tool Execution Problems**
   - Restart Claude Desktop or Cursor.ai completely
   - Check the logs for detailed error messages:
     ```bash
     # macOS
     tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
     ```

4. **Performance Issues**
   - Consider adding appropriate indexes to frequently queried fields
   - Use projection to limit the data returned in queries
   - Use limit and skip parameters for pagination

### Getting Help

If you encounter issues:
- Review the [MCP Documentation](https://modelcontextprotocol.io)
- Submit an issue on our [GitHub repository](https://github.com/1rb/mongo-mcp/issues)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 