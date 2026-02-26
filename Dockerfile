# production Dockerfile for the Next.js app
# CRITICAL: Install ALL dependencies including dev (typescript required for next.config.ts)
FROM node:20-alpine AS builder
WORKDIR /app

# copy package metadata and install ALL dependencies
COPY package*.json ./
RUN npm ci

# copy source and delete any old build artifacts
COPY . .
RUN rm -rf .next
# set dummy MongoDB URI for build (won't connect, just needed for config parsing)
ENV MONGODB_URI=mongodb://localhost:27017/build-placeholder
RUN npm run build

# runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# set NODE_ENV just in case
ENV NODE_ENV=production

# copy standalone output (includes server.js and minimal dependencies)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node","server.js"]
