# Base image
FROM node:20-alpine

# Install necessary dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
# Set minimal environment variables needed for build
ENV ENABLE_SCHEDULER=false

ENV NEXTAUTH_SECRET="bda4f27e2e67a7c4a5d93e0f9e3b8b8e3dca9f6279f93baf237cd8769d3a9123"

ENV DATABASE_URL=mysql://mukesh:mukesh%40vis123@db.vis.com.pk:3306/vis_company

ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
RUN npm run build

# Change ownership of the app directory to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Clear build-time environment variables and set runtime defaults
ENV NODE_ENV=production
ENV ENABLE_SCHEDULER=true
ENV NEXTAUTH_SECRET=
ENV DATABASE_URL=

# Expose port
EXPOSE 3000
ENV PORT= 3000
# Start the application
CMD ["npm", "start"]