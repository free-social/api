# --- Stage 1: Development & Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install ALL dependencies (including dev dependencies)
COPY package*.json ./
RUN npm install

# 2. Install global tools for development
RUN npm install -g nodemon typescript ts-node npm@11

# 3. Copy source code
COPY . .

# 4. Build the project
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs ./dist/docs

# Expose port
EXPOSE 4001

# Start the app
CMD ["node", "dist/index.js"]
