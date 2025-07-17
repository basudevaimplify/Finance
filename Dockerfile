# QRT Closure Platform - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build the app (outputs to dist/)
RUN npm run build

# Remove devDependencies after build to keep image small
RUN npm prune --production

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod -R 755 uploads

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application using compiled JS
CMD ["npm", "run", "start"]