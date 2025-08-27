# Dockerfile for Coolify with pgai support
FROM node:20-alpine

WORKDIR /app

# Install Python and pip for pgai
RUN apk add --no-cache python3 py3-pip

# Install pgai Python package globally
RUN pip3 install --break-system-packages pgai

# Copy package files
COPY package*.json tsconfig.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy initialization scripts
COPY init-pgai.js ./

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]