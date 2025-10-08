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
ENV NEXTAUTH_SECRET="bda4f27e2e67a7c4a5d93e0f9e3b8b8e3dca9f6279f93baf237cd8769d3a9123"
ENV DATABASE_URL="mysql://mukesh:mukesh%40vis123@db.vis.com.pk:3306/vis_company"
ENV NEXTAUTH_URL="http://192.168.1.214:5001"
ENV NEXT_PUBLIC_APP_URL="http://192.168.1.214:5001"
ENV SKIP_DB_CONNECTION=true

RUN npm run build


# ---------- Runtime Stage ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma (REQUIRED for Prisma to work)
RUN apk add --no-cache openssl libc6-compat

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
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Runtime envs (can be overridden at container start)
ENV NODE_ENV=production
ENV ENABLE_SCHEDULER=true
ENV NEXTAUTH_SECRET=
ENV DATABASE_URL=

# Expose port
EXPOSE 5001
ENV PORT=5001
# Health check


# Start app
CMD ["npm", "start"]
