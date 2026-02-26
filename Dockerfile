# production Dockerfile for the Next.js app
# build stage
FROM node:20-alpine AS builder
WORKDIR /app

# copy package metadata and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# only copy production deps and built output
COPY --from=builder /app/package*.json ./
# prune dev dependencies before copying node_modules
RUN npm prune --production && \
    cp -R /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# set NODE_ENV just in case
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm","start"]
