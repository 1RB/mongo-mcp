#!/bin/bash
# MongoDB MCP Server script
# IMPORTANT: Edit the MongoDB URI below with your actual connection string

# ===== EDIT YOUR MONGODB URI HERE =====
MONGO_URI="mongodb+srv://username:password@hostname/?retryWrites=true&w=majority"
# ======================================

# Echo the URI for debugging (comment this out in production)
echo "MongoDB URI: $MONGO_URI"

# Determine the script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Detect environment (Windows Git Bash, WSL, or native Unix)
if [[ "$(uname -r)" == *Microsoft* ]] || [[ "$(uname -r)" == *microsoft* ]]; then
  # Running in WSL
  echo "Detected environment: WSL"
  # Convert WSL path to Windows path by removing /mnt/ and converting to Windows format
  WIN_SCRIPT_DIR=$(echo "$SCRIPT_DIR" | sed 's|^/mnt/\(.\)|\1:|' | sed 's|/|\\|g')
  NODE_PATH="/mnt/c/Program Files/nodejs/node.exe"
  INDEX_PATH="${WIN_SCRIPT_DIR}\\build\\index.js"
  echo "Using Windows Node.js at: $NODE_PATH"
  echo "Running script at: $INDEX_PATH"
  "$NODE_PATH" "$INDEX_PATH" "$MONGO_URI"
elif [[ "$(uname)" == *MINGW* ]] || [[ "$(uname)" == *MSYS* ]]; then
  # Running in Git Bash on Windows
  echo "Detected environment: Git Bash on Windows"
  WIN_SCRIPT_DIR=$(echo "$SCRIPT_DIR" | sed 's|^/\(.\)/|\1:\\|' | sed 's|/|\\|g')
  INDEX_PATH="${WIN_SCRIPT_DIR}\\build\\index.js"
  echo "Using Windows Node.js"
  echo "Running script at: $INDEX_PATH"
  node "$INDEX_PATH" "$MONGO_URI"
else
  # Running in native Linux/macOS
  echo "Detected environment: Native Unix"
  echo "Using system Node.js"
  node "$SCRIPT_DIR/build/index.js" "$MONGO_URI"
fi

# Keep the script running until manually terminated
echo "MongoDB MCP Server running. Press Ctrl+C to stop."
while true; do
  sleep 1
done 