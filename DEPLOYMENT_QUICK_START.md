# Quick Start Deployment (5 Minutes)

## The Fastest Way to Deploy

### Step 1: Neon Database (1 minute)
```
1. Go to console.neon.tech
2. Sign up with GitHub
3. Create project → Copy connection string
4. Save it for next step
```

### Step 2: Vercel Backend (2 minutes)
```
1. Go to vercel.com/new
2. Import: karanpandeweb/karanpande_website
3. Add these environment variables:
   - DATABASE_URL = (your Neon URL from Step 1)
   - ADMIN_USERNAME = karan
   - ADMIN_PASSWORD = (create a strong password)
   - JWT_SECRET = (generate at randomkeygen.com)
   - CORS_ORIGINS = http://localhost:3000,https://your-pages-url.pages.dev
4. Click Deploy
5. Copy your Vercel URL (e.g., your-app.vercel.app)
```

### Step 3: Cloudflare Pages Frontend (2 minutes)
```
1. Go to dash.cloudflare.com/pages
2. Create a project → Connect to Git
3. Select: karanpandeweb/karanpande_website
4. Build settings:
   - Framework: Create React App
   - Build command: npm --prefix frontend run build
   - Output: frontend/build
5. Add env var:
   - REACT_APP_BACKEND_URL = (your Vercel URL from Step 2)
6. Click Deploy
7. Your site is LIVE! 🎉
```

## Your Live URLs

- **Frontend:** `https://your-project.pages.dev`
- **API:** `https://your-app.vercel.app/api`
- **Admin:** `https://your-project.pages.dev/admin`

## Test It

1. Visit your Cloudflare Pages URL
2. Try admin login (username: karan, password: what you set)
3. Done! ✅

## Cost

**$0/month** - Everything on free tier

---

See `DEPLOYMENT.md` for detailed instructions and custom domain setup.
