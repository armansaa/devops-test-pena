FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose application port
EXPOSE 3000

# Run as non-root user
USER node

# Start the application
CMD ["node", "index.js"]
