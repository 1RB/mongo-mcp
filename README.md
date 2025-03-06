# MongoDB MCP Server

A Model Context Protocol (MCP) server that connects to MongoDB and provides tools for interacting with MongoDB collections through Large Language Models like Claude in Cursor.

## Quick Start

### Prerequisites

- Node.js v14+ (v16+ recommended)
- MongoDB database (local or Atlas)
- Bash-compatible shell (Git Bash, WSL, or native bash on macOS/Linux)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/1rb/mongo-mcp.git
   cd mongo-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Configure your MongoDB connection:
   - Open the `mongo-mcp-example.sh` file in a text editor
   - Update the MongoDB URI with your actual connection string
   ```bash
   # ===== EDIT YOUR MONGODB URI HERE =====
   MONGO_URI="mongodb+srv://username:password@hostname/?retryWrites=true&w=majority"
   # ======================================
   ```

### Running the Server

The script will automatically detect your environment (WSL, Git Bash, or native Unix) and run with the appropriate settings:

**Windows with Git Bash:**
```bash
bash mongo-mcp-example.sh
```

**Windows with WSL:**
```bash
bash mongo-mcp-example.sh
```

**macOS/Linux:**
```bash
chmod +x mongo-mcp-example.sh
./mongo-mcp-example.sh
```

### Setting Up in Cursor

1. Open Cursor
2. Go to Settings → Features → MCP
3. Click on "+ Add New MCP Server"
4. Fill in the following details:
   - **Name**: mongo-server (or any name you prefer)
   - **Type**: Command
   - **Command to run**: `bash /full/path/to/mongo-mcp-example.sh` 
5. Click "Save"
6. The MongoDB MCP server should now appear in your MCP servers list
7. Click the refresh button if the tools don't appear automatically

![Adding MongoDB MCP Server to Cursor](https://i.imgur.com/kBpJNLV.png)

*Note: Always use the full absolute path to the script in the Command to run field.*

### Tested Environments

This MCP server has been successfully tested on:
- Windows 10/11 using Git Bash
- Windows 10/11 using WSL 2
- Windows/Cursor integration

## Using MongoDB Tools in Cursor

Once set up, you can use these tools in Cursor's Composer by asking questions like:

- "Show me the schema for the users collection in my database"
- "Run an aggregation query to count documents by status in the orders collection"
- "Analyze the sales data in the orders collection to find monthly trends"

## Features

- **Collection Schema Resources**: View the schema of any MongoDB collection
- **Aggregation Query Tool**: Run read-only aggregation queries on MongoDB collections
- **Data Analysis Prompts**: Pre-built prompts for common data analysis tasks

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that allows LLMs to access external data and functionality. This server implements the MCP specification to provide MongoDB database access to LLMs in MCP-compatible applications like Cursor.

## Configuration Details

### MongoDB Connection String

Your MongoDB connection string should be in this format:
```
mongodb+srv://username:password@hostname/?options
```

Replace `username`, `password`, `hostname`, and `options` with your actual MongoDB credentials.

If your MongoDB password contains special characters, make sure to properly URL-encode them:
- `:` becomes `%3A`
- `/` becomes `%2F`
- `@` becomes `%40`
- etc.

### Platform-Specific Path Formats

**Windows with Git Bash:**
- Use forward slashes in Cursor configuration: `bash C:/Users/username/path/to/mongo-mcp-example.sh`

**Windows with WSL:**
- Use WSL path format in Cursor configuration: `bash /mnt/c/Users/username/path/to/mongo-mcp-example.sh`

**macOS/Linux:**
- Use standard Unix paths: `bash /path/to/mongo-mcp-example.sh`

### TypeScript Configuration

The included `tsconfig.json` is configured for:
- ES2022 target
- Node16 module format
- Output to `./build` directory
- TypeScript strict mode

## Available Tools in Detail

### Resources

- **Collection Schema**: `mongodb://{database}/{collection}/schema`
  - Shows the fields available in a collection based on a sample document
  - Example usage in Cursor: "Show me the schema for the orders collection in the sales database"

### Tools

- **Aggregate Query**: Run MongoDB aggregation pipelines
  - Parameters:
    - `database`: The database name
    - `collection`: The collection name
    - `pipeline`: A JSON string representing the aggregation pipeline
  - Example usage in Cursor: "Run an aggregation query to count documents by status in the orders collection"
  - Advanced example: "Run this aggregation pipeline on the users collection: [{ $match: { age: { $gt: 21 } } }, { $group: { _id: \"$city\", count: { $sum: 1 } } }]"

### Prompts

- **Data Analysis**: Analyze data in a MongoDB collection
  - Parameters:
    - `collection`: The collection name
    - `question`: The analysis question
  - Example usage in Cursor: "Analyze the sales data in the orders collection to find monthly trends"

## Project Structure

```
mongo-mcp/
├── build/                         # Compiled JavaScript output
├── src/                           # TypeScript source code
│   └── mongodb-mcp-server.ts      # Main server implementation
├── .gitignore                     # Git ignore configuration
├── mongo-mcp-example.sh           # MongoDB MCP server script
├── package.json                   # Node.js package configuration
├── README.md                      # This file
└── tsconfig.json                  # TypeScript configuration
```

## Security Considerations

### MongoDB Connection Security

- This server only provides read-only access to MongoDB by design
- The MongoDB URI should be kept secure
- Use a MongoDB user with read-only permissions for security
- Consider using MongoDB Atlas IP allowlisting to restrict access

## Development

### Making Changes

1. Modify the TypeScript source in `src/mongodb-mcp-server.ts`
2. Build the project with `npm run build`
3. Test your changes by running the script

### Adding New Tools or Resources

To add new MongoDB tools:

1. Add new tool implementations in `src/mongodb-mcp-server.ts`
2. Follow the existing patterns for resources, tools, or prompts
3. Update the README to document the new capabilities

## Troubleshooting

### Connection Issues

- **Error: "Invalid scheme, expected connection string..."**
  - Check that your MongoDB URI is correctly formatted in the script
  - Make sure special characters in the URI are properly URL-encoded

- **Error: "Could not connect to any servers in your MongoDB Atlas cluster"**
  - Check that your network can reach MongoDB
  - Verify IP allowlisting if using MongoDB Atlas
  - Check username, password, and cluster name

### Path Issues

- **Error: "No such file or directory" or "Cannot find module..."**
  - Make sure the script's path handling is correct for your environment
  - Check the debug output to see what paths are being used
  - Ensure all paths in the Cursor configuration are absolute and use the correct format for your platform

### Cursor Integration Issues

- **MCP server not appearing in Cursor**
  - Verify your MCP configuration in Cursor settings
  - Restart Cursor
  - Check the Cursor console for error messages

- **Tools not available in Cursor**
  - Click the refresh button on the MCP server card in Cursor settings
  - Check if the server is running by looking at the debug log
  - Make sure the tools are correctly registered in the server

## Version Compatibility

- MCP SDK: v1.6.1+
- MongoDB Driver: v6.14.2+
- Node.js: v14+ (v16+ recommended)
- TypeScript: v5.8.2+

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) - For the MCP specification
- [Cursor](https://docs.cursor.com/context/model-context-protocol) - For MCP client implementation
- [MongoDB](https://mongodb.com) - For the database driver
