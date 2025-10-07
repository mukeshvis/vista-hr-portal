# HR Portal - Portainer Deployment Checklist ✅

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] GitHub Actions build completed successfully
- [ ] MySQL container running in Portainer
- [ ] Know your server IP address

---

## MySQL Container Setup

Container Name: `hr-portal-mysql`
Image: `mysql:8.0`
Port: `3306:3306`

**Environment Variables to Add:**

- [ ] `MYSQL_ROOT_PASSWORD` = `_________________`
- [ ] `MYSQL_DATABASE` = `hr_portal`
- [ ] `MYSQL_USER` = `hr_user`
- [ ] `MYSQL_PASSWORD` = `_________________`

✅ Click "Deploy the container"
⏰ Wait 60 seconds for MySQL to start

---

## HR Portal Container Setup

Container Name: `hr-portal-app`
Image: `ghcr.io/YOUR_USERNAME/hr-portal:main`
Port: `3000:3000`

**Environment Variables to Add:**

- [ ] `DATABASE_URL` = `mysql://hr_user:PASSWORD@hr-portal-mysql:3306/hr_portal`
  - ⚠️ Replace `PASSWORD` with same as MySQL's `MYSQL_PASSWORD`

- [ ] `NEXTAUTH_SECRET` = `_________________`
  - 💡 Generate: `openssl rand -base64 32`

- [ ] `NEXTAUTH_URL` = `http://YOUR_IP:3000`
  - ⚠️ Replace `YOUR_IP` with actual server IP

- [ ] `NEXT_PUBLIC_APP_URL` = `http://YOUR_IP:3000`
  - ⚠️ Same as NEXTAUTH_URL

- [ ] `NODE_ENV` = `production`

- [ ] `PORT` = `3000`

- [ ] `HOSTNAME` = `0.0.0.0`

✅ Click "Deploy the container"
⏰ Wait 40 seconds for health check

---

## Post-Deployment Verification

### 1. Check Container Status
- [ ] MySQL container: Green "running"
- [ ] HR Portal container: Green "running" with health "healthy"

### 2. Check HR Portal Logs
In Portainer: Containers → hr-portal-app → Logs

**Should see:**
- [ ] ✅ Database connected successfully

**Should NOT see:**
- [ ] ❌ Invalid value undefined
- [ ] ❌ Engine is not yet connected
- [ ] ❌ Failed to connect

### 3. Test Health Endpoint
```bash
curl http://YOUR_IP:3000/api/health
```

**Expected Response:**
- [ ] Status: 200 OK
- [ ] Body: `{"status":"healthy","database":"connected"}`

### 4. Access Application
Open browser: `http://YOUR_IP:3000`

- [ ] Login page loads
- [ ] No errors in browser console
- [ ] Can login successfully
- [ ] Dashboard loads

---

## Common Issues & Quick Fixes

### ❌ Container Restarting
**Check:** Logs for error message
**Fix:** See troubleshooting section in PORTAINER-MANUAL-DEPLOY.md

### ❌ "Invalid value undefined"
**Check:** Environment variables are set
**Fix:** Add all 7 required environment variables

### ❌ "Access denied for user"
**Check:** DATABASE_URL password matches MYSQL_PASSWORD
**Fix:** Update DATABASE_URL with correct password

### ❌ "Can't reach database server"
**Check:** MySQL container is running
**Fix:** Start MySQL container, wait 60 seconds, restart HR Portal

### ❌ 404 Not Found on /api/health
**Check:** Container is using latest image
**Fix:** Recreate container with "Pull latest image" checked

---

## Environment Variables Template

Copy this and fill in the blanks:

```bash
# MySQL Container
MYSQL_ROOT_PASSWORD=_______________
MYSQL_DATABASE=hr_portal
MYSQL_USER=hr_user
MYSQL_PASSWORD=_______________

# HR Portal Container
DATABASE_URL=mysql://hr_user:_______________@hr-portal-mysql:3306/hr_portal
NEXTAUTH_SECRET=_______________
NEXTAUTH_URL=http://_______________:3000
NEXT_PUBLIC_APP_URL=http://_______________:3000
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

---

## Quick Reference

| Setting | Value |
|---------|-------|
| MySQL Image | `mysql:8.0` |
| HR Portal Image | `ghcr.io/YOUR_USERNAME/hr-portal:main` |
| MySQL Port | `3306:3306` |
| HR Portal Port | `3000:3000` |
| Database Name | `hr_portal` |
| Database User | `hr_user` |
| MySQL Container Name | `hr-portal-mysql` |
| App Container Name | `hr-portal-app` |

---

## Success Criteria ✅

Deployment is successful when ALL these are true:

✅ Both containers running (green status)
✅ HR Portal container shows "healthy" status
✅ Logs show "✅ Database connected successfully"
✅ Health endpoint returns `{"status":"healthy"}`
✅ Can access app on http://YOUR_IP:3000
✅ Can login successfully
✅ No errors in container logs
✅ No errors in browser console

---

## Need Help?

1. Check logs: Containers → hr-portal-app → Logs
2. Check environment: Containers → hr-portal-app → Inspect → Env
3. Verify all environment variables are set (should NOT be empty)
4. Share logs if still having issues

---

## Update Application

When you push new code:

1. [ ] Wait for GitHub Actions to complete
2. [ ] Go to: Containers → hr-portal-app
3. [ ] Click "Recreate"
4. [ ] Check "Pull latest image"
5. [ ] Click "Recreate" button
6. [ ] Verify in logs: No errors
7. [ ] Test: http://YOUR_IP:3000

---

**Pro Tip:** Save your environment variable values somewhere safe (password manager) so you can easily recreate the container if needed!
