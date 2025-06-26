# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./
COPY --from=build /app/src/utils/sqlite-db.js ./src/utils/
COPY --from=build /app/scripts ./scripts

# Expose port
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]