# ---------- Build Stage ----------
FROM node:20-alpine AS builder

# Install necessary dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy dependency files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev for build)
RUN npm ci --ignore-scripts

# Copy remaining project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app (dummy envs just for build)
ARG NEXTAUTH_SECRET=dummy-secret
ARG DATABASE_URL=mysql://user:pass@localhost:3306/db
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build


# ---------- Runtime Stage ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Set timezone to Asia/Karachi (Pakistan)
ENV TZ=Asia/Karachi
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Karachi /etc/localtime && \
    echo "Asia/Karachi" > /etc/timezone && \
    apk del tzdata

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Runtime envs (can be overridden at container start)
ENV NODE_ENV=production
ENV ENABLE_SCHEDULER=false
ENV PORT=5001

# Expose port
EXPOSE 5001

# Start app
CMD ["npm", "start"]
