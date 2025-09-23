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
# ENV NEXTAUTH_SECRET=dummy-secret-for-build-only
ENV NEXTAUTH_SECRET=bda4f27e2e67a7c4a5d93e0f9e3b8b8e3dca9f6279f93baf237cd8769d3a9123
ENV DATABASE_URL=mysql://mukesh:mukesh%40vis123@db.vis.com.pk:3306/vis_company
ENV NEXTAUTH_URL=http://192.168.1.214:5001
ENV NEXT_PUBLIC_APP_URL=http://192.168.1.214:5001

RUN npm run build

# Change ownership of the app directory to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Clear build-time environment variables and set runtime defaults
ENV NODE_ENV=production
ENV ENABLE_SCHEDULER=true

# Expose port
EXPOSE 5001
ENV PORT=5001
# Start the application
CMD ["npm", "start"]