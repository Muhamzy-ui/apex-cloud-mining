# 🚀 APEX MINING - DEPLOYMENT GUIDE

## **Recommended Architecture**

```
┌──────────────────────────────────────────────────────────┐
│  YOUR DOMAIN: yourdomain.com                             │
│  ├─ Frontend: vercel.yourdomain.com (SPA)               │
│  │   └─ Hosted on: VERCEL                                │
│  │                                                       │
│  └─ Backend: api.yourdomain.com (REST API)              │
│      └─ Hosted on: RENDER                                │
│         ├─ PostgreSQL Database                           │
│         ├─ Redis Cache (for Celery)                      │
│         └─ Celery Worker (background tasks)             │
```

---

## **Step 1: Prepare GitHub Repository**

### 1.1 Initialize Git (if not already done)
```bash
cd c:\Users\HP\apex-cloud-mining
git init
git add .
git commit -m "Initial commit: Full stack apex mining app"
```

### 1.2 Create `.gitignore` Files
✅ **Backend `.gitignore`** - Already created  
✅ **Frontend `.gitignore`** - Already present  

### 1.3 Verify Sensitive Files Are Ignored
```bash
# Files that MUST NOT be committed:
- .env (any environment file)
- db.sqlite3
- venv/ or .venv/
- node_modules/
- *.pyc
- __pycache__/
```

### 1.4 Push to GitHub
```bash
git remote add origin https://github.com/yourusername/apex-cloud-mining.git
git branch -M main
git push -u origin main
```

---

## **Step 2: Deploy Backend to RENDER**

### Why Render for Backend?
✅ Native PostgreSQL support  
✅ Built-in Redis for Celery  
✅ Django/Gunicorn optimized  
✅ Free tier available  
✅ Environment variables management  

### 2.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub repository

### 2.2 Create PostgreSQL Database
1. Dashboard → New → PostgreSQL
2. Name: `apex-postgres`
3. Plan: **Free** (for testing)
   - For production: Choose Standard
4. Copy the **Internal Database URL** (you'll need this)
5. Create database

### 2.3 Create Redis Cache
1. Dashboard → New → Redis
2. Name: `apex-redis`
3. Plan: **Free**
4. Copy the **Redis URL** (you'll need this)
5. Create service

### 2.4 Deploy Django Backend
1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   ```
   Name: apex-backend
   Runtime: Python
   Build Command: pip install -r requirements.txt && python manage.py migrate
   Start Command: gunicorn apex_project.wsgi:application --bind 0.0.0.0:$PORT
   ```

### 2.5 Add Environment Variables
Go to Settings → Environment Variables and add:

```
ALLOWED_HOSTS=apex-backend.onrender.com,api.yourdomain.com
DEBUG=False
SECRET_KEY=<generate-with-python-secrets>

# Database (from PostgreSQL service)
DB_NAME=apex_db_production
DB_USER=postgres
DB_PASSWORD=<shown in postgres dashboard>
DB_HOST=<internal-host-from-postgres>
DB_PORT=5432

# Redis
REDIS_URL=redis://:<password>@<host>:<port>

# CORS (allow your frontend domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Payment Settings
PAYSTACK_SECRET_KEY=sk_live_xxx

# Other settings from .env.example
```

### 2.6 Generate SECRET_KEY
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.7 Connect Custom Domain
1. Go to Backend service → Settings
2. Custom Domain: `api.yourdomain.com`
3. Update your DNS records (instructions provided by Render)

---

## **Step 3: Deploy Frontend to VERCEL**

### Why Vercel for Frontend?
✅ Optimized for React/Vite  
✅ Global CDN (fast worldwide delivery)  
✅ Zero-config deployment  
✅ Instant git sync  
✅ Free tier generous  

### 3.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your `apex-cloud-mining` repository

### 3.2 Configure Vercel Project
1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### 3.3 Add Environment Variables
Project Settings → Environment Variables:

```
VITE_API_URL=https://api.yourdomain.com/api/v1
```

(For development, it auto-uses `http://localhost:8000/api/v1` from `.env.local`)

### 3.4 Connect Custom Domain
1. Go to Settings → Domains
2. Add: `yourdomain.com` and `www.yourdomain.com`
3. Follow DNS instructions to create CNAME records

---

## **Step 4: Configure DNS Records**

### At Your Domain Registrar (GoDaddy, Namecheap, etc.)

#### For Backend API:
```
Type: CNAME
Name: api
Value: apex-backend.onrender.com
```

#### For Frontend:
```
Type: CNAME
Name: @
Value: <vercel-cname-from-dashboard>

Type: CNAME
Name: www
Value: <vercel-cname-from-dashboard>
```

**Note:** Propagation takes 24-48 hours

---

## **Step 5: Database Initialization**

After deploying to Render:

```bash
# SSH into Render backend service
# Or use Render dashboard → Shell tab

# Run migrations
python manage.py migrate

# Create superuser for Django admin
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

Or Render auto-runs migrations via `release` command in Procfile.

---

## **Step 6: Test Everything**

### Test Backend API
```bash
curl https://api.yourdomain.com/api/v1/auth/me/
# Should return 401 (not authenticated) - that's correct
```

### Test Frontend
```bash
# Visit https://yourdomain.com
# Should load React app
# Check browser console for any API errors
```

### Test Login Flow
1. Go to https://yourdomain.com/login
2. Register new account
3. Should see dashboard
4. Verify API calls reach backend (check Network tab)

---

## **Step 7: Monitoring & Maintenance**

### Render Dashboard
- View logs: Services → apex-backend → Logs
- Monitor CPU/Memory: Services → Metrics
- Redeploy: Services → Manual Deploy

### Vercel Dashboard
- View logs: Deployments → Logs
- Monitor performance: Analytics
- Redeploy: Deployments → Redeploy

### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/api/v1/payments/settings/

# Frontend
curl https://yourdomain.com/
```

---

## **Troubleshooting**

### Frontend shows "Cannot POST /api/v1/auth/login"
**Fix:** Backend API URL is wrong in `VITE_API_URL` env var

```bash
# Verify in Vercel dashboard:
# Environment Variables → VITE_API_URL = https://api.yourdomain.com/api/v1
```

### "CORS error" in browser console
**Fix:** Update `CORS_ALLOWED_ORIGINS` in Render:

```
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Database connection error
**Fix:** Verify in Render:
```
DB_HOST=<internal-postgres-hostname-exactly-as-shown>
DB_PASSWORD=<match-postgres-service>
```

### "502 Bad Gateway" from Render
**Fix:** 
1. Check backend logs: Services → Logs
2. Common cause: Missing environment variables
3. Restart service: Settings → Restart Service

---

## **Security Checklist**

- ✅ SECRET_KEY is unique and strong (not default)
- ✅ DEBUG=False in production
- ✅ ALLOWED_HOSTS includes only your domain
- ✅ CORS_ALLOWED_ORIGINS includes only your frontend
- ✅ PAYSTACK_SECRET_KEY only in Render env (never in code)
- ✅ Database password is strong
- ✅ All `.env` files in `.gitignore`
- ✅ HTTPS only (Render/Vercel enforce this automatically)

---

## **Cost Estimate (Monthly)**

| Service | Plan | Cost |
|---------|------|------|
| Render Backend | Free (dev) / Starter ($7) | Free → $7 |
| Render Database | Free (dev) / Standard ($15) | Free → $15 |
| Render Redis | Free (dev) / Starter ($5) | Free → $5 |
| Vercel Frontend | Free | $0 |
| **Total** | | **Free → $27** |

**For production:** Expect $25-50/month for reliable service.

---

## **Quick Reference: Files Created**

```
backend/
  ├── .gitignore         ✅ NEW
  ├── .env.example       ✅ NEW
  ├── Procfile           ✅ NEW (for Render)
  ├── render.yaml        ✅ NEW (optional, Render native config)
  └── requirements.txt   (already exists)

frontend/
  ├── .env.example       ✅ NEW
  ├── vercel.json        ✅ NEW
  ├── vite.config.js     ✅ UPDATED (env handling)
  └── src/services/api.js ✅ UPDATED (dynamic API_URL)
```

---

## **Next Steps**

1. ✅ Update this file with your actual domain
2. ✅ Generate SECRET_KEY
3. ✅ Push to GitHub
4. ✅ Create Render account (free)
5. ✅ Create Vercel account (free)
6. ✅ Deploy backend → Render
7. ✅ Deploy frontend → Vercel
8. ✅ Configure DNS at registrar
9. ✅ Test API + Frontend connectivity
10. ✅ Monitor logs for errors

**Estimated time to deploy:** 20-30 minutes

---

**Questions?** Check Render docs: https://render.com/docs  
Or Vercel docs: https://vercel.com/docs
