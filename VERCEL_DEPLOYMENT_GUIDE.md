# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy your AWS Resource Dashboard to Vercel.

## 📋 Prerequisites

- ✅ GitHub account with your repository pushed
- ✅ Vercel account (free at https://vercel.com)
- ✅ Backend API deployed (or running on a server)

---

## 🔧 Step 1: Prepare Frontend for Deployment

### 1.1 Ensure Build is Successful
```bash
npm run build
```
✅ Should complete with **0 errors** and **~117 KB** bundle size.

### 1.2 Create `.env.local` (Development)
```bash
# For local development
VITE_API_URL=http://localhost:5000/api/v1
```

### 1.3 Update Git Repository
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

---

## 🌐 Step 2: Set Up Backend (Choose One)

### Option A: Deploy Backend to Heroku (Recommended for Easy Setup)

**Heroku is shutting down**, use **Railway** or **Render** instead.

### Option B: Deploy Backend to Railway.app (Easiest)

1. **Sign up at https://railway.app**
2. **Connect GitHub** → Select your repository
3. **Create new project** → Select "Python" environment
4. **Add these environment variables** in Railway dashboard:
   ```
   SECRET_KEY=your-secret-key-here
   FLASK_ENV=production
   ```
5. **Deploy** → Railway will auto-deploy on git push
6. **Copy the deployed URL** (e.g., `https://your-app.railway.app`)

### Option C: Deploy Backend to Render.com

1. **Sign up at https://render.com**
2. **New Web Service** → Connect GitHub
3. **Select repository** → Deploy
4. **Runtime**: Python 3.9+
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `gunicorn api:app`
7. **Copy the deployed URL**

### Option D: Use AWS EC2 (Advanced)

Deploy backend to EC2 instance and note the URL.

---

## 🚀 Step 3: Deploy Frontend to Vercel

### 3.1 Push Code to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin master
```

### 3.2 Connect to Vercel

**Option A: Via CLI (Quick)**
```bash
npm i -g vercel
vercel
```
Follow prompts to authenticate and deploy.

**Option B: Via Web Dashboard (Recommended)**

1. **Go to https://vercel.com/dashboard**
2. **Click "Add New Project"**
3. **"Import Git Repository"** → Select your ConsoleSensei-Cloud repo
4. **Configure project:**
   - Framework: `Vite`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
5. **Add Environment Variables** (Critical!):
   ```
   VITE_API_URL = https://your-backend-url.railway.app/api/v1
   ```
   (Replace with your actual backend URL from Step 2)

6. **Click "Deploy"** → Vercel builds and deploys 🎉

---

## 📝 Step 4: Verify Deployment

### Test Frontend
```bash
# Vercel will provide a URL like:
# https://your-project.vercel.app
```

Access in browser → Should load without errors

### Test API Connection

1. Open deployed URL: `https://your-project.vercel.app`
2. Navigate to: `/app/aws-resources`
3. Try entering AWS credentials and clicking "Scan"
4. Check browser console for any errors

If you see API errors, check:
- ✅ VITE_API_URL is correct in Vercel environment
- ✅ Backend is running and accessible
- ✅ CORS is enabled on backend
- ✅ Backend URL is reachable from Vercel servers

---

## 🔑 Complete Environment Setup

### Local Development (.env.local)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_KEY=
```

### Vercel Production (Project Settings → Environment Variables)
```
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_API_KEY=your-api-key-if-needed
```

---

## 🛠️ Troubleshooting

### Issue: "VITE_API_URL is not defined"
**Solution**: Add environment variable to Vercel dashboard
1. Go to **Project Settings** → **Environment Variables**
2. Add `VITE_API_URL` with your backend URL
3. Redeploy: `vercel --prod`

### Issue: "Cannot connect to backend API"
**Check**:
1. Backend URL is correct in env variables
2. Backend server is running
3. CORS is enabled on backend
4. No firewall blocking requests

**Fix for backend CORS** (Python Flask):
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Enables CORS for all routes
```

### Issue: Build fails on Vercel
**Solution**:
```bash
# Locally verify build works
npm run build

# Check for TypeScript errors
npm run typecheck

# Verify no unused imports
npm run lint
```

### Issue: Blank page after deployment
**Check**:
1. Browser console for errors
2. Network tab for failed requests
3. Vercel build logs in project dashboard
4. Environment variables are set correctly

---

## 📊 Deployment Checklist

Before deploying, verify:

- [ ] Code pushed to GitHub
- [ ] `npm run build` succeeds locally
- [ ] `npm run typecheck` passes
- [ ] No compilation errors
- [ ] Backend is deployed and accessible
- [ ] Environment variables configured in Vercel
- [ ] CORS enabled on backend
- [ ] GitHub branch is `master`

---

## 🔄 Continuous Deployment

After initial setup, Vercel automatically:
- ✅ Deploys on every `git push` to master
- ✅ Creates preview deployments for PRs
- ✅ Shows build status and logs

### Manual Redeploy (if needed)
```bash
vercel --prod
```

---

## 📈 Performance Tips

### Optimize Build Size
Current: **~117 KB** (already good!)

### Enable Caching
Already configured in `vercel.json` with security headers.

### Monitor Performance
- Vercel Dashboard → Analytics
- Check build times and page load metrics

---

## 🎯 Recommended Backend Deployment

### Railway.app (Easiest)
```
Pros: ✅ Easy setup, auto-deploy, good free tier
Cons: ❌ Limited free resources
```

### Render.com
```
Pros: ✅ Free tier, reliable, good UI
Cons: ❌ Spins down after 15 min inactivity
```

### AWS EC2
```
Pros: ✅ Full control, scalable
Cons: ❌ Requires manual setup, ongoing costs
```

---

## 📚 Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Railway Deployment](https://docs.railway.app)
- [Render Deployment](https://render.com/docs)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🎉 After Deployment

### Share Your App
```
Frontend: https://your-project.vercel.app
Dashboard: https://your-project.vercel.app/app/aws-resources
```

### Monitor & Maintain
- Check Vercel Analytics regularly
- Monitor backend API performance
- Keep dependencies updated
- Review logs for issues

### Scale as Needed
- Add more backend servers
- Implement caching
- Optimize database queries
- Consider CDN for assets

---

## ✨ Summary

1. ✅ Deploy backend to Railway/Render
2. ✅ Push frontend code to GitHub
3. ✅ Connect GitHub to Vercel
4. ✅ Add environment variables
5. ✅ Vercel auto-deploys
6. ✅ Access your live app!

**Time to Deploy**: ~15-30 minutes

**Cost**: FREE (for both Vercel and Railway free tiers)

---

**Questions?** Check Vercel documentation or Railway/Render support.

**Last Updated**: January 31, 2026
