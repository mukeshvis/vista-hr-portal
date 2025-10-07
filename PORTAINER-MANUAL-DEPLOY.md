# Portainer Manual Deployment - Step by Step

## Deployment Steps (Urdu/English)

### Step 1: MySQL Container Pehle Deploy Karein

1. **Portainer mein jao:** Containers → Add Container

2. **Settings:**
   - **Name:** `hr-portal-mysql`
   - **Image:** `mysql:8.0`

3. **Port Mapping:**
   - Host: `3306` → Container: `3306`

4. **Environment Variables** (click "+ add environment variable"):
   ```
   MYSQL_ROOT_PASSWORD = YourRootPassword123
   MYSQL_DATABASE = hr_portal
   MYSQL_USER = hr_user
   MYSQL_PASSWORD = YourUserPassword123
   ```

5. **Restart Policy:** `Unless stopped`

6. **Deploy container** → Wait 30-60 seconds for MySQL to start

---

### Step 2: HR Portal App Deploy Karein

1. **Portainer mein jao:** Containers → Add Container

2. **Settings:**
   - **Name:** `hr-portal-app`
   - **Image:** `ghcr.io/YOUR_GITHUB_USERNAME/hr-portal:main`

   ⚠️ **Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username!**

3. **Port Mapping:**
   - Host: `3000` → Container: `3000`

4. **Environment Variables** (click "+ add environment variable" for EACH one):

   **Variable 1:**
   ```
   Name:  DATABASE_URL
   Value: mysql://hr_user:YourUserPassword123@hr-portal-mysql:3306/hr_portal
   ```
   ⚠️ Password must match MySQL's MYSQL_PASSWORD above!

   **Variable 2:**
   ```
   Name:  NEXTAUTH_SECRET
   Value: your-super-secret-key-minimum-32-characters-long-change-this
   ```
   💡 Generate a secure one: `openssl rand -base64 32`

   **Variable 3:**
   ```
   Name:  NEXTAUTH_URL
   Value: http://YOUR_SERVER_IP:3000
   ```
   ⚠️ Replace `YOUR_SERVER_IP` with your actual server IP (e.g., http://192.168.1.50:3000)

   **Variable 4:**
   ```
   Name:  NEXT_PUBLIC_APP_URL
   Value: http://YOUR_SERVER_IP:3000
   ```
   ⚠️ Same as NEXTAUTH_URL

   **Variable 5:**
   ```
   Name:  NODE_ENV
   Value: production
   ```

   **Variable 6:**
   ```
   Name:  PORT
   Value: 3000
   ```

   **Variable 7:**
   ```
   Name:  HOSTNAME
   Value: 0.0.0.0
   ```

5. **Network:**
   - Same network as MySQL (or default bridge)

6. **Restart Policy:** `Unless stopped`

7. **Deploy container**

---

## Screenshot Guide (What You See)

When adding environment variables in Portainer, you'll see:

```
┌─────────────────────────────────────┐
│ Environment variables               │
├─────────────────────────────────────┤
│ [+ add environment variable]        │
│                                     │
│ name: DATABASE_URL                  │
│ value: mysql://hr_user:pass@mysql..│
│ [remove]                            │
│                                     │
│ name: NEXTAUTH_SECRET               │
│ value: your-secret-here...          │
│ [remove]                            │
│                                     │
│ [+ add environment variable]        │
└─────────────────────────────────────┘
```

Click **"+ add environment variable"** button for EACH variable you need to add.

---

## Quick Copy-Paste Values

### For MySQL Container:
```
MYSQL_ROOT_PASSWORD = RootPass123Change
MYSQL_DATABASE = hr_portal
MYSQL_USER = hr_user
MYSQL_PASSWORD = UserPass123Change
```

### For HR Portal Container:
```
DATABASE_URL = mysql://hr_user:UserPass123Change@hr-portal-mysql:3306/hr_portal
NEXTAUTH_SECRET = ChangeThisToRandomString32CharsMinimum
NEXTAUTH_URL = http://192.168.1.50:3000
NEXT_PUBLIC_APP_URL = http://192.168.1.50:3000
NODE_ENV = production
PORT = 3000
HOSTNAME = 0.0.0.0
```

⚠️ **IMPORTANT:**
- Change `UserPass123Change` to same password in both places
- Change `192.168.1.50` to your server's IP
- Change `ChangeThisToRandomString32CharsMinimum` to a secure random string

---

## Verification

After deploying both containers:

### 1. Check if MySQL is running:
- Portainer → Containers → hr-portal-mysql
- Status should be **green "running"**

### 2. Check if HR Portal is running:
- Portainer → Containers → hr-portal-app
- Status should be **green "running"** (wait 40 seconds for health check)

### 3. Check logs:
- Click on `hr-portal-app` → Logs
- Should see: `✅ Database connected successfully`
- Should NOT see: `undefined` errors

### 4. Test health endpoint:
```bash
curl http://YOUR_SERVER_IP:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 5. Access the app:
Open browser: `http://YOUR_SERVER_IP:3000`

---

## Troubleshooting

### Container keeps restarting?

**Check logs:**
- Containers → hr-portal-app → Logs

**Common issues:**

1. **"Invalid value undefined"**
   - You forgot to add environment variables
   - Go back and add all 7 variables

2. **"Access denied for user"**
   - Password mismatch
   - DATABASE_URL password must match MYSQL_PASSWORD

3. **"Can't reach database server"**
   - MySQL container not running
   - Wrong host in DATABASE_URL
   - Should be: `hr-portal-mysql` (container name)

4. **"Connection refused"**
   - MySQL still starting
   - Wait 60 seconds and restart hr-portal-app

---

## Need to Update Environment Variables?

1. Go to: Containers → hr-portal-app → Duplicate/Edit
2. Scroll to Environment Variables section
3. Change values
4. Click "Deploy the container" → "Replace"

---

## Image Update Karna Hai?

When you push new code to GitHub:

1. Wait for GitHub Actions to build new image
2. Go to: Containers → hr-portal-app → Recreate
3. Check "Pull latest image"
4. Recreate container

---

## Full Working Example

```
MySQL Container:
├─ Name: hr-portal-mysql
├─ Image: mysql:8.0
├─ Port: 3306:3306
└─ Env:
   ├─ MYSQL_ROOT_PASSWORD = MyRootPass123!
   ├─ MYSQL_DATABASE = hr_portal
   ├─ MYSQL_USER = hr_user
   └─ MYSQL_PASSWORD = MyUserPass123!

HR Portal Container:
├─ Name: hr-portal-app
├─ Image: ghcr.io/username/hr-portal:main
├─ Port: 3000:3000
└─ Env:
   ├─ DATABASE_URL = mysql://hr_user:MyUserPass123!@hr-portal-mysql:3306/hr_portal
   ├─ NEXTAUTH_SECRET = abc123xyz789randomstring32chars
   ├─ NEXTAUTH_URL = http://192.168.1.100:3000
   ├─ NEXT_PUBLIC_APP_URL = http://192.168.1.100:3000
   ├─ NODE_ENV = production
   ├─ PORT = 3000
   └─ HOSTNAME = 0.0.0.0
```

Access: http://192.168.1.100:3000
