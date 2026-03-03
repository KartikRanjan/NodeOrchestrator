# Node Worker - Node.js 20 Alpine
FROM node:20-alpine

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 4001

# Start development server
CMD ["npm", "run", "dev"]
