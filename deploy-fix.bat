@echo off
REM Deploy Fix Script for HR Portal Docker Issues

echo.
echo ========================================
echo HR Portal - Docker Deployment Fix
echo ========================================
echo.

REM Check if git repo
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository
    exit /b 1
)

REM Check for uncommitted changes
git status --short > temp_status.txt
set /p HAS_CHANGES=<temp_status.txt
del temp_status.txt

if not "%HAS_CHANGES%"=="" (
    echo [INFO] Found changes to commit
    git status -s
    echo.

    REM Add all changes
    echo [INFO] Adding all changes...
    git add .

    REM Commit
    echo [INFO] Committing changes...
    git commit -m "fix: Docker deployment issues - Prisma connection, health checks, port config"

    echo [SUCCESS] Changes committed
) else (
    echo [INFO] No changes to commit
)

REM Push to remote
echo.
echo [INFO] Pushing to remote...
git push origin main
if errorlevel 1 git push origin master

echo.
echo [SUCCESS] Done! GitHub Actions will now build the Docker image.
echo.
echo Next steps:
echo 1. Wait for GitHub Actions to complete
echo 2. Open Portainer and create a new stack
echo 3. Upload portainer-stack.yml
echo 4. Update environment variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)
echo 5. Deploy the stack
echo.
echo Full guide: See DEPLOYMENT-FIXES.md
echo.
pause
