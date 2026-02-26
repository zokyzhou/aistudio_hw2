# production Dockerfile for the Next.js app
FROM node:20-slim AS builder
WORKDIR /app

# Set NODE_ENV for build to ensure standalone output
ENV NODE_ENV=production

# copy package metadata and install ALL dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# copy source and delete any old build artifacts
COPY . .
RUN rm -rf .next
# set dummy MongoDB URI for build (won't connect, just needed for config parsing)
ENV MONGODB_URI=mongodb://localhost:27017/build-placeholder
RUN npm run build

# runtime stage
FROM node:20-slim AS runner
WORKDIR /app

# set NODE_ENV just in case
ENV NODE_ENV=production

# copy standalone output with entire structure
COPY --from=builder /app/.next/standalone/my-agent-app/ ./
# copy public assets  
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node","server.js"]
