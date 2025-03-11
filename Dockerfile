# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use Node.js 18+ as the base image
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the project
RUN npm run build

# Use a minimal Node.js image for the runtime
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the built files from the builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package-lock.json /app/node_modules ./

# Specify the command to run the server
ENTRYPOINT ["node", "dist/index.js"] 