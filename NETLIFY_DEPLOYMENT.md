# Netlify Deployment Guide for KBG Website

## ✅ Prerequisites Complete
- ✓ `netlify.toml` configuration file created
- ✓ `public/_redirects` file created for React Router support
- ✓ Build tested successfully

## 🚀 Deployment Options

### Option 1: Deploy via Netlify CLI (Recommended for Quick Deploy)

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy your site**:
   ```bash
   netlify deploy --prod
   ```
   
   Or for a draft deployment first:
   ```bash
   netlify deploy
   ```

### Option 2: Deploy via Git (Recommended for Continuous Deployment)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository: `KBG_website`
   - Netlify will auto-detect the settings from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Option 3: Manual Deploy via Netlify Drop

1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your `dist` folder
3. Your site will be deployed instantly!

## 📋 Build Configuration (Already Set)

The `netlify.toml` file includes:
- ✓ Build command: `npm run build`
- ✓ Publish directory: `dist`
- ✓ SPA redirect rules for React Router
- ✓ Security headers
- ✓ Asset caching optimization

## 🔧 Post-Deployment Steps

1. **Custom Domain** (Optional):
   - Go to Site settings → Domain management
   - Add your custom domain
   - Configure DNS settings as instructed

2. **Environment Variables** (If needed):
   - Go to Site settings → Environment variables
   - Add any required API keys or environment variables

3. **HTTPS**:
   - Netlify automatically provisions SSL certificates
   - Your site will be available via HTTPS

## 🎯 Expected Build Output

```
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].css
  │   └── index-[hash].js
  ├── vite.svg
  └── _redirects
```

## 🔍 Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **Routes not working**: Ensure `_redirects` file is in `public/` folder
- **Assets not loading**: Check base path in `vite.config.js`

## 🌐 Your Site Will Be Available At

After deployment, Netlify will provide:
- A random subdomain: `https://[random-name].netlify.app`
- Option to customize: `https://[your-custom-name].netlify.app`
- Option to add your own domain

---

**Ready to deploy!** Choose your preferred option above and follow the steps.
