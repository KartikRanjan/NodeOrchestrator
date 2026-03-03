# CMS Service - Node.js 20 Alpine
FROM node:20-alpine

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
