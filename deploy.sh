#!/bin/bash

# Script to deploy to GitHub and Vercel
# Usage: ./deploy.sh [github-token] [github-username] [repo-name]
#   If token is provided, it will create the repo automatically
#   Otherwise, follow the manual instructions

set -e

GITHUB_TOKEN="${1:-}"
REPO_NAME="${3:-heuristicux-analysis-platform}"
GITHUB_USER="${2:-vagg-droid}"

echo "🚀 Setting up GitHub repository..."

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "Remote 'origin' already exists. Updating..."
    git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
else
    echo "Adding remote 'origin'..."
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

# Try to create repository via GitHub API if token is provided
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Creating repository on GitHub..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"${REPO_NAME}\",\"private\":false,\"auto_init\":false}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Repository created successfully!"
        echo ""
        echo "Pushing code to GitHub..."
        git push -u origin main
        echo ""
        echo "✅ Code pushed to GitHub!"
        echo ""
        echo "📋 Next steps for Vercel deployment:"
        echo "1. Go to https://vercel.com/new"
        echo "2. Import your GitHub repository: ${GITHUB_USER}/${REPO_NAME}"
        echo "3. Vercel will auto-detect Vite settings"
        echo "4. Add GEMINI_API_KEY as an environment variable in Vercel"
        echo "5. Deploy!"
    else
        echo "⚠️  Failed to create repository via API (HTTP $HTTP_CODE)"
        echo "$BODY"
        echo ""
        echo "Please create the repository manually and run: git push -u origin main"
    fi
else
    echo ""
    echo "✅ Git remote configured!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Create a new repository on GitHub: https://github.com/new"
    echo "   - Repository name: ${REPO_NAME}"
    echo "   - Make it public or private (your choice)"
    echo "   - DO NOT initialize with README, .gitignore, or license"
    echo ""
    echo "2. After creating the repository, run:"
    echo "   git push -u origin main"
    echo ""
    echo "3. Then connect your GitHub repo to Vercel:"
    echo "   - Go to https://vercel.com/new"
    echo "   - Import your GitHub repository"
    echo "   - Vercel will auto-detect Vite settings"
    echo "   - Add GEMINI_API_KEY as an environment variable in Vercel"
    echo "   - Deploy!"
    echo ""
    echo "💡 Tip: To automate repo creation, run:"
    echo "   ./deploy.sh YOUR_GITHUB_TOKEN ${GITHUB_USER} ${REPO_NAME}"
fi
