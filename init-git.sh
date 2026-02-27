#!/bin/bash
# Initialize Git and push to GitHub for Apex Cloud Mining

echo ""
echo "================================"
echo "APEX MINING - GIT INITIALIZATION"
echo "================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed"
    echo "Install from: https://git-scm.com/"
    exit 1
fi

# Initialize if not already done
if [ ! -d .git ]; then
    echo "[1/4] Initializing Git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "✓ Git repository already exists"
fi

# Add all files
echo ""
echo "[2/4] Adding all files..."
git add .
echo "✓ Files staged"

# Show what's being committed
echo ""
echo "Files to commit:"
git status --short
echo ""

# Create initial commit
echo "[3/4] Creating initial commit..."
git commit -m "Initial commit: Production-ready Apex Mining application
- Django REST API with PostgreSQL
- React 19 + Vite frontend
- Full authentication system
- Mining, payments, referrals modules
- Admin panel
- Support widget
- Ready for Render + Vercel deployment"
echo "✓ Commit created"

# Setup GitHub remote
echo ""
echo "[4/4] Configuring GitHub remote..."
echo ""
echo "Before proceeding, you need:"
echo "1. A GitHub account (https://github.com)"
echo "2. To create a new repository named 'apex-cloud-mining'"
echo "3. Your repository URL (https://github.com/YOUR_USER/apex-cloud-mining.git)"
echo ""
read -p "Enter your GitHub repository URL (or press Enter to skip): " GITHUB_URL

if [ -n "$GITHUB_URL" ]; then
    git remote add origin "$GITHUB_URL"
    echo "✓ GitHub remote configured"
    
    echo ""
    echo "Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓✓✓ SUCCESS! ✓✓✓"
        echo "Code pushed to: $GITHUB_URL"
        echo ""
        echo "Next steps:"
        echo "1. Go to https://render.com"
        echo "2. Create new Web Service"
        echo "3. Connect this GitHub repository"
        echo "4. Follow DEPLOYMENT.md for setup"
    else
        echo ""
        echo "✗ Push failed. Common reasons:"
        echo "- Wrong repository URL"
        echo "- No internet connection"
        echo "- GitHub authentication needed"
        echo ""
        echo "Fix and try: git push -u origin main"
    fi
else
    echo ""
    echo "Skipped GitHub push."
    echo "To push later, run:"
    echo "  git remote add origin https://github.com/YOUR_USER/apex-cloud-mining.git"
    echo "  git push -u origin main"
fi

echo ""
echo "================================"
echo "Git setup complete!"
echo "================================"
