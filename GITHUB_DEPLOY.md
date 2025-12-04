# GitHub Pages Deployment - Step by Step

## Step 1: Create GitHub Account

1. Go to https://github.com
2. Click "Sign up" (top right)
3. Enter your email, create a password, choose a username
4. Verify your email address

## Step 2: Create a New Repository

1. After logging in, click the **"+"** icon (top right)
2. Select **"New repository"**
3. Fill in:
   - **Repository name:** `pathfinder` (or any name you like)
   - **Description:** (optional) "Graph Theory Pathfinding Game"
   - **Visibility:** Select **"Public"** (required for free GitHub Pages)
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

## Step 3: Install Git (if not already installed)

Check if Git is installed:
```bash
git --version
```

If not installed, install it:
```bash
sudo apt update
sudo apt install git
```

## Step 4: Configure Git (first time only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 5: Upload Your Files to GitHub

Open terminal in your project directory and run:

```bash
# Navigate to your project
cd /media/marcel/Data/Projects/GIS/pathfinder

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Pathfinder game"

# Rename branch to main (GitHub uses 'main' by default)
git branch -M main

# Add GitHub repository as remote (REPLACE YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/pathfinder.git

# Push to GitHub
git push -u origin main
```

**Important:** Replace `YOUR_USERNAME` with your actual GitHub username!

When you run `git push`, GitHub will ask for:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your password - see Step 6)

## Step 6: Create Personal Access Token (for authentication)

1. Go to GitHub → Click your profile (top right) → **Settings**
2. Scroll down → Click **"Developer settings"** (left sidebar)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Fill in:
   - **Note:** "Pathfinder deployment"
   - **Expiration:** Choose duration (90 days recommended)
   - **Select scopes:** Check **"repo"** (full control)
6. Click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)
8. Use this token as your password when Git asks

## Step 7: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/pathfinder`
2. Click **"Settings"** tab (top of repository page)
3. Scroll down to **"Pages"** section (left sidebar)
4. Under **"Source"**, select:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Click **"Save"**
6. You'll see: "Your site is ready to be published at `https://YOUR_USERNAME.github.io/pathfinder/`"

## Step 8: Wait and Visit Your Site

1. Wait 1-2 minutes for GitHub to build your site
2. Visit: `https://YOUR_USERNAME.github.io/pathfinder/`
3. Your game should be live! 🎉

## Step 9: Updating Your Site (when you make changes)

Whenever you make changes to your code:

```bash
cd /media/marcel/Data/Projects/GIS/pathfinder

# Add changed files
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

GitHub Pages will automatically update your site in 1-2 minutes!

## Troubleshooting

**"Repository not found" error:**
- Check that you replaced `YOUR_USERNAME` correctly
- Verify the repository name matches

**"Authentication failed":**
- Make sure you're using a Personal Access Token, not your password
- Check that the token has "repo" scope enabled

**Site shows 404:**
- Wait a few more minutes (first deployment can take 5-10 minutes)
- Check that GitHub Pages is enabled in Settings → Pages
- Verify your branch is named "main" (not "master")

**Site loads but game doesn't work:**
- Open browser console (F12) and check for errors
- Verify all files were uploaded (check the repository on GitHub)
- Make sure `src/` folder and all `.js` files are present

## Quick Reference

Your site URL format:
```
https://YOUR_USERNAME.github.io/REPOSITORY_NAME/
```

Example:
```
https://johndoe.github.io/pathfinder/
```

