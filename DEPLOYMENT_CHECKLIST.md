# Cloudflare Deployment Checklist

Complete these steps in order to deploy your site.

## Pre-Deployment (One-time Setup)

- [ ] Create Cloudflare account at https://dash.cloudflare.com
- [ ] Register/transfer domain to Cloudflare
- [ ] Create Neon PostgreSQL database at https://console.neon.tech
- [ ] Copy Neon connection string

## GitHub Secrets Setup (For CI/CD)

1. Go to: GitHub Repo → Settings → Secrets and variables → Actions

- [ ] Add `CLOUDFLARE_API_TOKEN`
  - Get from: https://dash.cloudflare.com/profile/api-tokens
  - Create token with "Edit Cloudflare Workers" and "Pages" permissions
  
- [ ] Add `CLOUDFLARE_ACCOUNT_ID`
  - Get from: Cloudflare Dashboard right sidebar
  - It's a 32-character alphanumeric string

## Cloudflare Setup

1. Go to: https://dash.cloudflare.com → Workers & Pages → Settings

### Environment Variables

Add these **Environment Variables** (not secrets):
- [ ] `ENVIRONMENT` = `production`

### Secrets

Add these **Secrets** (encrypted):
- [ ] `DATABASE_URL` = PostgreSQL connection string from Neon
- [ ] `ADMIN_USERNAME` = Your admin username (e.g., "karan")
- [ ] `ADMIN_PASSWORD` = Strong password (min 12 chars, mixed case/numbers/symbols)
- [ ] `JWT_SECRET` = Generate with: `openssl rand -base64 32`
- [ ] `CORS_ORIGINS` = Your domain (e.g., "https://karanpande.in")

## Local Deployment (Optional Manual Steps)

If you prefer manual deployment:

```bash
# 1. Install wrangler globally
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy frontend to Pages
cd frontend
npm install
npm run build
wrangler pages deploy build --project-name karanpande-website

# 4. Deploy backend to Workers
cd ..
wrangler deploy --env production
```

## Cloudflare Dashboard Configuration

### Pages Setup

1. Go: Cloudflare → Pages → Create project → Connect to Git
2. Select: `karanpandeweb/karanpande_website`
3. Build settings:
   - [ ] Build command: `npm --prefix frontend run build`
   - [ ] Build output directory: `frontend/build`
   - [ ] Root directory: `/`
4. Click: "Save and Deploy"

### Workers Setup

1. Go: Cloudflare → Workers → Services
2. Create: New service named `karanpande-api`
3. Copy `backend/server.py` and `api/index.py`
4. Add environment variables from checklist above
5. Deploy

### Custom Domain (DNS)

1. Go: Cloudflare → Sites → Your domain
2. Update `wrangler.toml` with your Zone ID
3. Add DNS record for API subdomain (optional):
   ```
   api.yourdomain.com → CNAME → karanpande-api-prod.workers.dev
   ```

## Verification Steps

After deployment, verify everything works:

```bash
# Test 1: Frontend loads
curl https://yourdomain.com/
# Should return HTML (React app)

# Test 2: API health check
curl https://yourdomain.com/api/health
# Should return: {"status":"ok","database":"connected"}

# Test 3: Get albums (public endpoint)
curl https://yourdomain.com/api/albums
# Should return: [{"id":"...","name":"..."}]

# Test 4: Admin login
curl -X POST https://yourdomain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"karan","password":"YOUR_PASSWORD"}'
# Should return: {"token":"...","username":"karan"}
```

## Post-Deployment

- [ ] Update DNS nameservers to Cloudflare (if needed)
- [ ] Enable SSL/TLS: Cloudflare → SSL/TLS → set to "Full (strict)"
- [ ] Set up Page Rules for caching if needed
- [ ] Monitor deployments: https://dash.cloudflare.com → Pages/Workers → Deployments
- [ ] Test admin dashboard at `/admin` route
- [ ] Verify database is populated with seed data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway on /api | Check Worker logs: `wrangler tail --env production` |
| CORS errors | Verify `CORS_ORIGINS` environment variable |
| Database connection error | Test Neon connection: `psql $DATABASE_URL` |
| Static files not loading | Clear cache: Cloudflare → Caching → Purge cache |
| Login not working | Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` exactly match |

## Rollback

To rollback to previous deployment:
1. Cloudflare Dashboard → Pages/Workers → Deployments
2. Click previous deployment
3. Click "Rollback to this deployment"

## Support

- Cloudflare Docs: https://developers.cloudflare.com
- Neon Docs: https://neon.tech/docs
- See `CLOUDFLARE_DEPLOYMENT.md` for detailed guide
