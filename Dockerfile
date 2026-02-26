# production Dockerfile for the Next.js app
FROM node:20-slim AS builder
WORKDIR /app

# copy package metadata and install ALL dependencies (including dev for TS)
COPY package*.json ./
RUN npm ci

# copy source and delete any old build artifacts
COPY . .
RUN rm -rf .next
# set dummy MongoDB URI for build (won't connect, just needed for config parsing)
ENV MONGODB_URI=mongodb://localhost:27017/build-placeholder
RUN npm run build

# runtime stage
FROM node:20-slim AS runner
WORKDIR /app

# set runtime environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# copy package files
COPY --from=builder /app/package.json /app/package-lock.json ./
# copy built Next.js app and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["sh","-c","./node_modules/.bin/next start -H 0.0.0.0 -p ${PORT}"]
