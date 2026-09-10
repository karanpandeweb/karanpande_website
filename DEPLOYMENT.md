# Deployment Guide: Cloudflare Pages + Vercel Backend + Neon Database

This guide will help you deploy the Karan Pande Photography website to production.

## Architecture

```
Cloudflare Pages (Frontend)
    ↓ API calls
Vercel Serverless Functions (Backend)
    ↓ SQL queries
Neon PostgreSQL (Database)
```

## Cost

**$0/month** - Everything is on free tier

---

## Step 1: Set Up Neon PostgreSQL Database

### 1.1 Create Neon Account

1. Go to [console.neon.tech](https://console.neon.tech/)
2. Click **Sign up**
3. Sign up with GitHub (or email)
4. Create a new project

### 1.2 Get Database URL

1. In Neon dashboard, select your project
2. Click on the default database connection
3. Copy the connection string (looks like):
   ```
   postgresql://neondb_owner:password@ep-xyz.us-east-1.neon.tech/neondb?sslmode=require
   ```
4. **Save this somewhere safe** - you'll need it for Vercel

### 1.3 Verify Connection

Keep the Neon tab open - you'll reference this URL in the next step.

---

## Step 2: Deploy Backend on Vercel

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign up**
3. Sign up with GitHub
4. Authorize Vercel to access your GitHub account

### 2.2 Deploy Your Repository

1. In Vercel dashboard, click **Add New...** → **Project**
2. Search for `karanpande_website`
3. Click **Import**

### 2.3 Configure Environment Variables

Before deploying, you need to add environment variables:

1. In the import dialog, scroll down to **Environment Variables**
2. Add these variables (click **Add** for each one):

   **Variable 1: DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: Paste your Neon PostgreSQL URL from Step 1.2
   - Example: `postgresql://neondb_owner:password@ep-xyz.us-east-1.neon.tech/neondb?sslmode=require`

   **Variable 2: ADMIN_USERNAME**
   - Name: `ADMIN_USERNAME`
   - Value: `karan` (or your preferred admin username)

   **Variable 3: ADMIN_PASSWORD**
   - Name: `ADMIN_PASSWORD`
   - Value: Create a **strong password** (at least 12 characters)
   - Example: `MySecurePassword123!@#`

   **Variable 4: JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: Create a **random 32+ character string**
   - You can generate one here: https://randomkeygen.com/ (copy the "CodeIgniter Encryption Key")

   **Variable 5: CORS_ORIGINS**
   - Name: `CORS_ORIGINS`
   - Value: `http://localhost:3000,https://your-cloudflare-domain.pages.dev`
   - (Update this after Cloudflare deployment - for now just use these URLs)

### 2.4 Deploy

1. Click **Deploy**
2. Wait for deployment to complete (usually 2-3 minutes)
3. **Save your Vercel URL** - it will look like: `https://your-project-name.vercel.app`

### 2.5 Verify Backend is Working

1. Go to: `https://your-project-name.vercel.app/api/health`
2. You should see: `{"status": "ok", "database": "connected"}`
3. ✅ Backend is deployed!

---

## Step 3: Deploy Frontend on Cloudflare Pages

### 3.1 Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Click **Sign up**
3. Complete the signup process
4. Verify your email

### 3.2 Deploy on Cloudflare Pages

1. In Cloudflare dashboard, go to **Pages** (left sidebar)
2. Click **Create a project**
3. Click **Connect to Git**
4. Authorize Cloudflare to access your GitHub
5. Search for `karanpande_website`
6. Click **Connect**

### 3.3 Configure Build Settings

1. **Project name:** Give it a name (e.g., `karanpande-portfolio`)
2. **Framework preset:** Select **Create React App**
3. **Build command:** `npm --prefix frontend run build`
4. **Build output directory:** `frontend/build`

### 3.4 Add Environment Variables

1. Scroll down to **Environment variables**
2. Click **Add environment variable**
3. Add:
   - **Variable name:** `REACT_APP_BACKEND_URL`
   - **Value:** Your Vercel URL from Step 2.4 (example: `https://your-project-name.vercel.app`)
   - **Environments:** Select **Production**

### 3.5 Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (usually 2-3 minutes)
3. You'll see your Cloudflare Pages URL: `https://your-project-name.pages.dev`

### 3.6 Verify Frontend is Working

1. Go to: `https://your-project-name.pages.dev`
2. You should see your portfolio website
3. Try logging into admin panel
4. ✅ Frontend is deployed!

---

## Step 4: Add Custom Domain (Optional)

### 4.1 Register a Domain

If you don't have a domain:
1. Go to [Namecheap](https://www.namecheap.com/) or similar registrar
2. Buy your domain (e.g., `karanpande.com`)
3. Keep the registrar tab open

### 4.2 Add Domain to Cloudflare Pages

1. In Cloudflare Pages project dashboard
2. Go to **Custom domains**
3. Click **Add custom domain**
4. Enter your domain (e.g., `karanpande.com`)

### 4.3 Update Nameservers

Cloudflare will show you two nameservers:
- Example: `sue.ns.cloudflare.com`
- Example: `nick.ns.cloudflare.com`

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Find **Nameserver settings** or **DNS settings**
3. Replace the current nameservers with Cloudflare's nameservers
4. Save changes
5. Wait 24-48 hours for propagation

### 4.4 Update Backend CORS

Now that you have your final domain, update Vercel environment variables:

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update `CORS_ORIGINS`:
   - Old: `http://localhost:3000,https://your-project-name.pages.dev`
   - New: `http://localhost:3000,https://your-project-name.pages.dev,https://karanpande.com,https://www.karanpande.com`
5. Redeploy by pushing a commit or clicking **Redeploy**

---

## Verification Checklist

- [ ] Neon database created and URL copied
- [ ] Vercel backend deployed with all environment variables
- [ ] Backend health check working (`/api/health`)
- [ ] Cloudflare Pages frontend deployed
- [ ] Frontend loads without errors
- [ ] Admin login works
- [ ] Can view portfolio albums
- [ ] Custom domain (optional) pointing to Cloudflare
- [ ] CORS origins updated in Vercel

---

## Troubleshooting

### Frontend can't reach backend API

**Problem:** "Failed to fetch from API" error in console

**Solution:**
1. Check `REACT_APP_BACKEND_URL` in Cloudflare environment variables
2. Verify it matches your Vercel URL exactly
3. Check Vercel `CORS_ORIGINS` includes your Cloudflare domain
4. Clear browser cache and refresh

### Admin login fails

**Problem:** "Invalid credentials" error

**Solution:**
1. Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Vercel environment variables
2. Verify `JWT_SECRET` is at least 32 characters
3. Redeploy Vercel after changing environment variables

### Database connection error

**Problem:** "Database unavailable" in API health check

**Solution:**
1. Verify `DATABASE_URL` in Vercel environment variables
2. Check Neon is running (dashboard.neon.tech)
3. Verify connection string includes `?sslmode=require`
4. Redeploy Vercel

### Build fails on Cloudflare

**Problem:** Build error in Cloudflare dashboard

**Solution:**
1. Run locally: `cd frontend && npm run build`
2. Check for errors in console
3. Ensure all dependencies are installed: `npm install`
4. Commit fixes and push to GitHub
5. Cloudflare will auto-rebuild

---

## Next Steps

After deployment:

1. **Test thoroughly:**
   - Visit homepage
   - Navigate through albums
   - Test admin login
   - Upload test media
   - Update site settings

2. **Backup recovery codes:**
   - Go to admin panel
   - Create a recovery code
   - Store it somewhere safe

3. **Set up monitoring (optional):**
   - Vercel provides logs at [vercel.com](https://vercel.com)
   - Neon provides metrics at [console.neon.tech](https://console.neon.tech)

---

## Environment Variables Reference

| Variable | Example | Where |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...` | Vercel |
| `ADMIN_USERNAME` | `karan` | Vercel |
| `ADMIN_PASSWORD` | `SecurePass123!` | Vercel |
| `JWT_SECRET` | `abc123def456...` (32+ chars) | Vercel |
| `CORS_ORIGINS` | `https://yourdomain.com` | Vercel |
| `REACT_APP_BACKEND_URL` | `https://your-app.vercel.app` | Cloudflare Pages |

---

## Support

- **Neon help:** [Neon Docs](https://neon.tech/docs/)
- **Vercel help:** [Vercel Docs](https://vercel.com/docs)
- **Cloudflare help:** [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

**Congratulations! Your site is now live on Cloudflare Pages! 🎉**
