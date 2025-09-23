# Base image
FROM node:20-alpine

# Install necessary dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies first
RUN npm ci --ignore-scripts

# Copy remaining project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
# Set minimal environment variables needed for build
ENV ENABLE_SCHEDULER=false
ENV NEXTAUTH_SECRET=dummy-secret-for-build-only
ENV DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build

# Change ownership of the app directory to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Clear build-time environment variables and set runtime defaults
ENV NODE_ENV=production
ENV ENABLE_SCHEDULER=true

# Expose port
EXPOSE 3000
ENV PORT=3000
# Start the application
CMD ["npm", "start"]