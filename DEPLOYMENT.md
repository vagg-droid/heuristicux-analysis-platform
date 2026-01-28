# Deployment Guide

This guide will help you deploy the HeuristicUX Analysis Platform to Vercel via GitHub.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at https://vercel.com)
- A Gemini API key (for the application to work)

## Step 1: Push to GitHub

### Option A: Automated (if you have a GitHub Personal Access Token)

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name (e.g., "Vercel Deploy")
   - Select scope: `repo` (full control of private repositories)
   - Generate and copy the token

2. Run the deployment script:
   ```bash
   ./deploy.sh YOUR_GITHUB_TOKEN vagg-droid heuristicux-analysis-platform
   ```

### Option B: Manual

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Repository name: `heuristicux-analysis-platform`
   - Choose public or private
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. Push your code:
   ```bash
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and the `heuristicux-analysis-platform` repository
4. Click "Import"

5. Configure the project:
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `dist` (should be auto-detected)
   - **Install Command**: `npm install` (should be auto-detected)

6. Add Environment Variables:
   - Click "Environment Variables"
   - Add: `GEMINI_API_KEY` with your Gemini API key value
   - Make sure it's available for Production, Preview, and Development

7. Click "Deploy"

## Step 3: Verify Deployment

Once deployed, Vercel will provide you with a URL like:
`https://heuristicux-analysis-platform.vercel.app`

Visit the URL to verify your application is working correctly.

## Troubleshooting

- If the build fails, check the Vercel build logs
- Make sure `GEMINI_API_KEY` is set correctly in Vercel environment variables
- Verify that all dependencies are listed in `package.json`

## Updating Your Deployment

After making changes to your code:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. Push to GitHub:
   ```bash
   git push origin main
   ```

3. Vercel will automatically detect the push and redeploy your application!
