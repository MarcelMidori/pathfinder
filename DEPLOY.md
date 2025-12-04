# How to Deploy Pathfinder to the Web

This guide covers several free options to host your Pathfinder game online.

## Option 1: GitHub Pages (Recommended - Free & Easy)

### Steps:

1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository:**
   - Go to https://github.com/new
   - Name it `pathfinder` (or any name you like)
   - Make it **Public** (required for free GitHub Pages)
   - Click "Create repository"

3. **Upload your files:**
   
   **Using Git (recommended):**
   ```bash
   cd /media/marcel/Data/Projects/GIS/pathfinder
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pathfinder.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

   **Or using GitHub web interface:**
   - Click "uploading an existing file"
   - Drag and drop all your files (index.html, styles.css, src/, etc.)
   - Click "Commit changes"

4. **Enable GitHub Pages:**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Under "Source", select "main" branch
   - Click "Save"
   - Your site will be at: `https://YOUR_USERNAME.github.io/pathfinder/`

5. **Wait 1-2 minutes** for GitHub to build your site, then visit the URL!

---

## Option 2: Netlify Drop (Easiest - No Account Needed)

1. **Go to:** https://app.netlify.com/drop

2. **Drag and drop** your entire project folder onto the page

3. **Get instant URL** - Your site is live immediately!

4. **Optional:** Create account to get a custom domain and keep the site permanently

---

## Option 3: Vercel (Great for Developers)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /media/marcel/Data/Projects/GIS/pathfinder
   vercel
   ```

3. **Follow prompts** - it will give you a URL instantly

---

## Option 4: Surge.sh (Simple CLI)

1. **Install Surge:**
   ```bash
   npm install -g surge
   ```

2. **Deploy:**
   ```bash
   cd /media/marcel/Data/Projects/GIS/pathfinder
   surge
   ```

3. **Follow prompts** - choose a domain or use the random one provided

---

## Option 5: Cloudflare Pages (Free & Fast)

1. **Push to GitHub** (see Option 1, steps 1-3)

2. **Go to:** https://pages.cloudflare.com

3. **Connect your GitHub repository**

4. **Deploy** - Cloudflare will automatically deploy your site

---

## Quick Comparison

| Service | Difficulty | Free | Custom Domain | Best For |
|---------|-----------|------|--------------|----------|
| **GitHub Pages** | Easy | ✅ | ✅ | Long-term hosting |
| **Netlify Drop** | Easiest | ✅ | ❌ | Quick testing |
| **Vercel** | Easy | ✅ | ✅ | Developers |
| **Surge** | Easy | ✅ | ✅ | Simple CLI |
| **Cloudflare Pages** | Easy | ✅ | ✅ | Fast CDN |

---

## Recommended: GitHub Pages

GitHub Pages is recommended because:
- ✅ Free forever
- ✅ Reliable and fast
- ✅ Easy to update (just push changes)
- ✅ Supports custom domains
- ✅ Great for portfolios

---

## After Deployment

Once deployed, you can:
- Share the URL with anyone
- Add it to your portfolio
- Update by pushing new commits (GitHub Pages) or re-uploading files

---

## Troubleshooting

**If your site shows a blank page:**
- Check browser console (F12) for errors
- Make sure all files are uploaded (especially the `src/` folder)
- Verify `index.html` is in the root directory

**If modules don't load:**
- Make sure you're accessing via HTTPS (most hosts provide this automatically)
- Check that file paths are correct (case-sensitive on some servers)

