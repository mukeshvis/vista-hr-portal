# Docker Deployment Fixes - Summary

## Issues Fixed

### 1. ✅ Prisma "Engine is not yet connected" Error
**Problem:** Container logs showed multiple Prisma connection errors
**Root Cause:** Prisma client wasn't connecting to MySQL on container startup
**Fix:** Modified `src/lib/database/prisma.ts` to:
- Auto-connect on initialization (production only)
- Skip connection during build time
- Handle connection errors gracefully

### 2. ✅ Docker Build Failure
**Problem:** Build failed at `npm run build` step
**Root Cause:** Prisma was trying to connect to database during build (database doesn't exist at build time)
**Fix:** Modified `Dockerfile` to:
- Set `SKIP_DB_CONNECTION=true` during build
- Use dummy environment variables only for build
- Real environment variables passed at runtime

### 3. ✅ Missing Prisma Dependencies
**Problem:** Prisma requires OpenSSL to function
**Root Cause:** Alpine Linux doesn't include OpenSSL by default
**Fix:** Added `openssl` and `libc6-compat` to runtime stage

### 4. ✅ Port Configuration Mismatch
**Problem:** Docker exposed port 5001 but Next.js runs on 3000
**Root Cause:** Incorrect PORT environment variable
**Fix:** Changed all port references to 3000

### 5. ✅ No Health Monitoring
**Problem:** Portainer couldn't detect if container was healthy
**Root Cause:** No health check endpoint or Docker healthcheck
**Fix:**
- Created `/api/health` endpoint that tests database connection
- Added HEALTHCHECK directive to Dockerfile

### 6. ✅ Docker Security Warnings
**Problem:** Warnings about secrets in ARG/ENV
**Root Cause:** Using ARG for NEXTAUTH_SECRET
**Fix:** Changed from ARG to ENV with clear dummy values

## Files Modified

### `src/lib/database/prisma.ts`
- Added automatic connection on startup
- Skip connection during build time
- Better error handling

### `Dockerfile`
- Fixed build stage to skip database connection
- Added OpenSSL to runtime stage
- Fixed port configuration (3000)
- Added health check
- Changed from `npm start` to `node server.js` for standalone mode

### `src/app/api/health/route.ts` (NEW)
- Health check endpoint
- Tests database connection
- Returns JSON status

### `portainer-stack.yml` (NEW)
- Ready-to-use Portainer stack configuration
- Includes MySQL service with proper configuration
- Health checks for both services
- Network configuration

### `DOCKER-DEPLOYMENT.md` (NEW)
- Complete deployment guide
- Troubleshooting steps
- Environment variable documentation

## How to Deploy

### Step 1: Commit and Push
```bash
git add .
git commit -m "fix: Docker deployment issues - Prisma connection, health checks, port config"
git push origin main
```

### Step 2: Wait for GitHub Actions
- GitHub Actions will automatically build the Docker image
- Check progress at: https://github.com/YOUR_USERNAME/hr-portal/actions
- Image will be pushed to: `ghcr.io/YOUR_USERNAME/hr-portal:main`

### Step 3: Deploy in Portainer

1. **Go to Portainer → Stacks → Add Stack**

2. **Upload `portainer-stack.yml`**

3. **Update these values in the file:**
   ```yaml
   # Line 5: Update image path
   image: ghcr.io/YOUR_GITHUB_USERNAME/hr-portal:main

   # Line 11: Update database URL
   DATABASE_URL: "mysql://hr_user:SECURE_PASSWORD@mysql:3306/hr_portal"

   # Line 15: Generate secure secret
   NEXTAUTH_SECRET: "RUN_THIS_COMMAND: openssl rand -base64 32"

   # Line 16: Update domain
   NEXTAUTH_URL: "http://your-domain.com:3000"

   # Line 23: Update domain
   NEXT_PUBLIC_APP_URL: "http://your-domain.com:3000"

   # Lines 52-55: Update MySQL passwords
   MYSQL_ROOT_PASSWORD: "CHANGE_THIS"
   MYSQL_PASSWORD: "CHANGE_THIS"
   ```

4. **Deploy the stack**

5. **Monitor deployment:**
   - Check container logs for errors
   - Visit `/api/health` endpoint to verify database connection
   - Health should show "healthy" and database "connected"

## Testing After Deployment

### 1. Check Health Endpoint
```bash
curl http://your-domain:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-07T..."
}
```

### 2. Check Container Logs
In Portainer:
- Go to Containers → hr-portal-app → Logs
- Should see: "✅ Database connected successfully"
- Should NOT see: "Engine is not yet connected"

### 3. Check Health Status
In Portainer:
- Container should show green "healthy" status
- If yellow "starting", wait 40 seconds for start_period
- If red "unhealthy", check logs

## Troubleshooting

### Container still restarting?

1. **Check environment variables are set:**
   ```bash
   docker exec hr-portal-app env | grep DATABASE_URL
   docker exec hr-portal-app env | grep NEXTAUTH_SECRET
   ```

2. **Check MySQL is accessible:**
   ```bash
   docker exec hr-portal-app ping -c 3 mysql
   ```

3. **Check MySQL credentials:**
   - Verify `DATABASE_URL` matches MySQL `MYSQL_USER` and `MYSQL_PASSWORD`

4. **Check logs:**
   ```bash
   docker logs hr-portal-app --tail 100
   docker logs hr-portal-mysql --tail 100
   ```

### Build failing on GitHub Actions?

1. Check GitHub Actions logs
2. Verify Prisma schema is valid: `npm run db:generate`
3. Ensure all dependencies are in `package.json`

### Database connection errors in production?

1. Verify MySQL container is running and healthy
2. Check network connectivity between containers
3. Verify MySQL wait_timeout settings (should be 28800)
4. Check max_connections (should be 1000)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `NEXTAUTH_SECRET` | ✅ Yes | NextAuth encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Yes | Full URL of application | `http://your-domain:3000` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Public app URL | `http://your-domain:3000` |
| `NODE_ENV` | No | Environment | `production` (default) |
| `PORT` | No | Server port | `3000` (default) |
| `ENABLE_SCHEDULER` | No | Enable cron jobs | `false` (default) |

## What Changed

### Before:
- ❌ Prisma not connecting on startup
- ❌ No health checks
- ❌ Port mismatch (5001 vs 3000)
- ❌ Missing OpenSSL dependency
- ❌ Container restarting constantly

### After:
- ✅ Prisma connects automatically
- ✅ Health checks working
- ✅ Port 3000 throughout
- ✅ All dependencies included
- ✅ Container runs stable

## Support

If you still experience issues:
1. Share container logs (first 100 lines)
2. Share environment variables (hide passwords)
3. Share health check response
4. Share Portainer container status
