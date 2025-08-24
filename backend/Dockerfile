# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY package*.json tsconfig.json ./

# Install deps (including dev)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

# Copy only package files and install prod deps
COPY package*.json ./
RUN npm install --production

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]