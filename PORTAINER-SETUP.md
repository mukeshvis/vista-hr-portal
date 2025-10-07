# Portainer Deployment Setup Guide

## The Issue You're Seeing

Error: `Invalid value undefined for datasource "db"`

**Cause:** The `DATABASE_URL` environment variable is not being passed to the container.

## Solution: Set Environment Variables in Portainer

### Method 1: Using Stack (Recommended)

1. **In Portainer, go to:** Stacks → Add Stack

2. **Name it:** `hr-portal`

3. **Upload or paste** the `portainer-stack.yml` file

4. **BEFORE deploying, edit these lines in the YAML:**

```yaml
services:
  hr-portal:
    image: ghcr.io/YOUR_USERNAME/hr-portal:main  # ← UPDATE THIS
    environment:
      # ← UPDATE ALL THESE:
      DATABASE_URL: "mysql://hr_user:STRONG_PASSWORD@mysql:3306/hr_portal"
      NEXTAUTH_SECRET: "RUN: openssl rand -base64 32"
      NEXTAUTH_URL: "http://YOUR_DOMAIN:3000"
      NEXT_PUBLIC_APP_URL: "http://YOUR_DOMAIN:3000"
```

5. **Also update MySQL passwords:**

```yaml
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: "CHANGE_THIS_ROOT_PASSWORD"
      MYSQL_PASSWORD: "CHANGE_THIS_USER_PASSWORD"  # Must match DATABASE_URL password
```

6. **Deploy the stack**

---

### Method 2: Using Container (If deploying manually)

If you're deploying a single container without the stack:

1. **In Portainer, go to:** Containers → Add Container

2. **Image:** `ghcr.io/YOUR_USERNAME/hr-portal:main`

3. **Port mapping:** `3000:3000`

4. **Environment variables** - Add these one by one:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `mysql://username:password@mysql_host:3306/hr_portal` |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://your-domain:3000` |
| `NEXT_PUBLIC_APP_URL` | `http://your-domain:3000` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `HOSTNAME` | `0.0.0.0` |

5. **Network:** Connect to same network as your MySQL container

6. **Deploy container**

---

## Important: DATABASE_URL Format

The `DATABASE_URL` must be in this exact format:

```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

### Examples:

**If MySQL is in the same Portainer stack:**
```
DATABASE_URL=mysql://hr_user:mypassword123@mysql:3306/hr_portal
```

**If MySQL is on another container:**
```
DATABASE_URL=mysql://hr_user:mypassword123@hr-portal-mysql:3306/hr_portal
```

**If MySQL is on another server:**
```
DATABASE_URL=mysql://hr_user:mypassword123@192.168.1.100:3306/hr_portal
```

---

## Verify Environment Variables Are Set

After deploying, check if variables are set:

1. **In Portainer:** Containers → hr-portal-app → Inspect → Env

2. **Or via console:**
   ```bash
   # In Portainer: Containers → hr-portal-app → Console
   env | grep DATABASE_URL
   env | grep NEXTAUTH
   ```

You should see your actual values (not `undefined`).

---

## Common Mistakes

### ❌ Mistake 1: Forgot to update environment variables
**Symptom:** `undefined` error
**Fix:** Set `DATABASE_URL` and other required env vars

### ❌ Mistake 2: Wrong MySQL host
**Symptom:** `Can't reach database server`
**Fix:** Use service name `mysql` if in same stack, or container name, or IP address

### ❌ Mistake 3: Password mismatch
**Symptom:** `Access denied for user`
**Fix:** Make sure `DATABASE_URL` password matches `MYSQL_PASSWORD`

### ❌ Mistake 4: MySQL not ready
**Symptom:** `Connection refused`
**Fix:** Wait 30-60 seconds for MySQL to fully start

### ❌ Mistake 5: Using localhost
**Symptom:** `Connection refused`
**Fix:** Don't use `localhost` in `DATABASE_URL`, use MySQL container name or IP

---

## Testing Database Connection

Once container is running, test the database connection:

### 1. Check health endpoint:
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

### 2. Check logs:
In Portainer: Containers → hr-portal-app → Logs

You should see:
```
✅ Database connected successfully
```

You should NOT see:
```
❌ Failed to connect to database
Invalid value undefined for datasource
```

---

## Full Working Example

Here's a complete working configuration:

```yaml
version: '3.8'

services:
  hr-portal:
    image: ghcr.io/yourusername/hr-portal:main
    container_name: hr-portal-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "mysql://hr_user:MySecurePass123!@mysql:3306/hr_portal"
      NEXTAUTH_SECRET: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
      NEXTAUTH_URL: "http://192.168.1.50:3000"
      NEXT_PUBLIC_APP_URL: "http://192.168.1.50:3000"
      NODE_ENV: "production"
      PORT: "3000"
      HOSTNAME: "0.0.0.0"
    depends_on:
      - mysql
    networks:
      - hr-portal-network

  mysql:
    image: mysql:8.0
    container_name: hr-portal-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "RootPass123!"
      MYSQL_DATABASE: "hr_portal"
      MYSQL_USER: "hr_user"
      MYSQL_PASSWORD: "MySecurePass123!"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - hr-portal-network

networks:
  hr-portal-network:
    driver: bridge

volumes:
  mysql_data:
```

---

## Next Steps After Fixing

1. **Update environment variables** in Portainer
2. **Restart the container**
3. **Check logs** - should see "✅ Database connected successfully"
4. **Test health endpoint** - should return "healthy"
5. **Access the app** - should load without errors

---

## Still Having Issues?

Share these with me:

1. **Container logs** (first 50 lines):
   ```bash
   docker logs hr-portal-app --tail 50
   ```

2. **Environment variables** (hide passwords):
   ```bash
   docker exec hr-portal-app env | grep -E "DATABASE|NEXTAUTH"
   ```

3. **Network info**:
   ```bash
   docker network inspect hr-portal-network
   ```
