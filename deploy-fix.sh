#!/bin/bash

# Deploy Fix Script for HR Portal Docker Issues

echo "🚀 HR Portal - Docker Deployment Fix"
echo "======================================"
echo ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 Found changes to commit:"
    git status -s
    echo ""

    # Add all changes
    echo "➕ Adding all changes..."
    git add .

    # Commit
    echo "💾 Committing changes..."
    git commit -m "fix: Docker deployment issues

- Fixed Prisma 'Engine is not yet connected' error
- Added health check endpoint at /api/health
- Fixed port configuration (now using 3000)
- Added OpenSSL dependency for Prisma
- Skip database connection during build
- Added Portainer stack configuration
- Added deployment documentation

Fixes container restart issues in Portainer"

    echo "✅ Changes committed"
else
    echo "ℹ️  No changes to commit"
fi

# Push to remote
echo ""
echo "🔄 Pushing to remote..."
git push origin main || git push origin master

echo ""
echo "✅ Done! GitHub Actions will now build the Docker image."
echo ""
echo "📋 Next steps:"
echo "1. Wait for GitHub Actions to complete: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo "2. Open Portainer and create a new stack"
echo "3. Upload portainer-stack.yml"
echo "4. Update environment variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)"
echo "5. Deploy the stack"
echo ""
echo "📖 Full guide: See DEPLOYMENT-FIXES.md"
