# Docker Deployment Guide for HR Portal

## Issues Fixed

The following issues were causing Portainer restarts:

1. ✅ **Prisma Connection Issue** - "Engine is not yet connected" error
   - Fixed by ensuring Prisma connects on startup
   - Added proper connection pooling configuration
   - Added openssl to runtime image (required for Prisma)

2. ✅ **Port Mismatch** - Docker was exposing port 5001 but Next.js runs on 3000
   - Changed to port 3000 throughout

3. ✅ **Health Checks** - No way for Docker to know if container is healthy
   - Added `/api/health` endpoint
   - Added Docker HEALTHCHECK directive

4. ✅ **Database Connection Settings** - MySQL timeouts causing disconnects
   - Added proper MySQL connection settings
   - Increased wait_timeout and max_connections

## Deployment Options

### Option 1: Using Portainer Stack (Recommended)

1. **Push your code to GitHub** (triggers automatic Docker build via GitHub Actions)

2. **In Portainer:**
   - Go to **Stacks** → **Add stack**
   - Name it: `hr-portal`
   - Upload `portainer-stack.yml` OR paste its contents

3. **Update Environment Variables** in the stack file:
   ```yaml
   # Update these BEFORE deploying:
   DATABASE_URL: "mysql://hr_user:YOUR_SECURE_PASSWORD@mysql:3306/hr_portal"
   NEXTAUTH_SECRET: "YOUR_SECURE_SECRET_KEY"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL: "http://YOUR_DOMAIN:3000"
   NEXT_PUBLIC_APP_URL: "http://YOUR_DOMAIN:3000"
   ```

4. **Update MySQL passwords** in the MySQL service section

5. **Update the image path**:
   ```yaml
   image: ghcr.io/YOUR_GITHUB_USERNAME/hr-portal:main
   ```

6. **Deploy the stack**

### Option 2: Using Docker CLI

```bash
# Build the image
docker build -t hr-portal:latest .

# Run with environment variables
docker run -d \
  --name hr-portal \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/hr_portal" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  hr-portal:latest
```

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `NEXTAUTH_SECRET` | NextAuth encryption key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your app | `http://your-domain.com:3000` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://your-domain.com:3000` |

## Health Check Endpoint

Your app now has a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

## Troubleshooting

### Container keeps restarting

1. **Check logs in Portainer:**
   - Go to Containers → hr-portal → Logs

2. **Common issues:**
   - Missing `DATABASE_URL` environment variable
   - Wrong MySQL credentials
   - MySQL container not ready yet (wait 30-40 seconds)
   - Missing `NEXTAUTH_SECRET`

### Database connection errors

1. **Verify MySQL is running:**
   ```bash
   docker ps | grep mysql
   ```

2. **Check MySQL health:**
   ```bash
   docker exec hr-portal-mysql mysqladmin ping -h localhost -u root -p
   ```

3. **Test connection from app container:**
   ```bash
   docker exec hr-portal-app node -e "console.log(process.env.DATABASE_URL)"
   ```

### Port already in use

If port 3000 is already in use, change the port mapping in `portainer-stack.yml`:
```yaml
ports:
  - "8080:3000"  # Now accessible on port 8080
```

## Monitoring Container Health

Portainer will show health status automatically. You can also check manually:

```bash
# Check container health status
docker inspect hr-portal-app | grep Health -A 10

# View health check logs
docker logs hr-portal-app | grep health
```

## Database Migration

If you need to run database migrations after deployment:

```bash
# Enter the container
docker exec -it hr-portal-app sh

# Run Prisma commands
npx prisma migrate deploy
npx prisma db push
```

## Updating the Application

1. Push code changes to GitHub (triggers new build)
2. In Portainer: Stacks → hr-portal → Update Stack → Pull latest image
3. Or via CLI:
   ```bash
   docker pull ghcr.io/YOUR_USERNAME/hr-portal:main
   docker restart hr-portal-app
   ```

## Security Notes

⚠️ **IMPORTANT:**
- Change all default passwords
- Use strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- Don't commit `.env` files to Git
- Use Docker secrets for production deployments
- Keep MySQL port (3306) internal only (remove from `ports:` if not needed externally)

## Support

If issues persist:
1. Check container logs: `docker logs hr-portal-app`
2. Check database logs: `docker logs hr-portal-mysql`
3. Verify environment variables are set correctly
4. Ensure all services are on the same network: `docker network inspect hr-portal-network`
