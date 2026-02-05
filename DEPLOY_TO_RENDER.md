# Deploy SLAYT to Render (Free Tier)

## Quick Deploy

Click the button below to deploy SLAYT to Render in one click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bomac1193/Slayt)

## Manual Deployment Steps

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub account (free)

### 2. Deploy from GitHub

1. **Connect Repository**
   - Click "New +" → "Web Service"
   - Connect GitHub account if not already connected
   - Select repository: `bomac1193/Slayt`
   - Branch: `master`

2. **Configure Service**
   - **Name**: `slayt-api` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

3. **Set Environment Variables**
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (default for Render)
   - `SLAYT_API_KEY`: Generate a random secure key (e.g., `openssl rand -base64 32`)
   - `SESSION_SECRET`: Generate another random key
   - `MONGODB_URI`: (see Database Setup below)
   - `FRONTEND_URL`: Your Render service URL (e.g., `https://slayt-api.onrender.com`)

4. **Click "Create Web Service"**

### 3. Database Setup (Free MongoDB)

#### Option A: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account (M0 cluster is free forever)
3. Create cluster → Create database user
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/slayt`
5. Add to Render environment variables as `MONGODB_URI`

#### Option B: Render PostgreSQL (if you want to migrate)
1. In Render dashboard: "New +" → "PostgreSQL"
2. Name: `slayt-db`
3. Plan: `Free`
4. Copy connection string to environment variables

### 4. Health Check
- Render automatically checks `/health` endpoint
- SLAYT is configured with this endpoint
- Service will show "Live" when healthy

### 5. Get Your API URL
After deployment completes:
- Your SLAYT API will be at: `https://YOUR-SERVICE-NAME.onrender.com`
- Health check: `https://YOUR-SERVICE-NAME.onrender.com/health`
- Publish endpoint: `https://YOUR-SERVICE-NAME.onrender.com/api/publish`

### 6. Update Boveda Configuration
In your Boveda project, update `.env.local`:

```bash
# Replace with your actual Render URL
SLAYT_API_URL=https://your-slayt-service.onrender.com
SLAYT_API_KEY=your-generated-api-key
```

## Limitations of Free Tier

- **Cold Starts**: Service spins down after 15 min of inactivity, takes ~30s to wake up
- **750 Hours/Month**: More than enough for development
- **No Custom Domain**: Uses `*.onrender.com` subdomain
- **Limited Resources**: 512MB RAM, shared CPU

## Monitoring

### Check Service Status
```bash
curl https://your-slayt-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Test Boveda Integration
From Boveda Studio:
```bash
curl -X POST https://your-slayt-service.onrender.com/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Source: boveda" \
  -d '{
    "character": {
      "id": "char_123",
      "name": "Luna"
    },
    "content": {
      "text": "Test post from Boveda"
    },
    "platforms": ["TWITTER"]
  }'
```

## Troubleshooting

### Service Won't Start
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### MongoDB Connection Failed
- Whitelist Render IPs in MongoDB Atlas (or use 0.0.0.0/0 for development)
- Verify connection string format
- Check database user permissions

### API Returns 401 Unauthorized
- Verify SLAYT_API_KEY matches between Render and Boveda
- Check Authorization header format: `Bearer YOUR_KEY`

### Cold Start Delays
- First request after inactivity takes ~30 seconds (free tier limitation)
- Consider upgrading to paid plan ($7/mo) for always-on service

## Cost Optimization

**Free Tier (Current)**
- Web Service: Free (750 hours)
- MongoDB Atlas: Free (512MB)
- **Total: $0/month**

**Upgrade Options**
- Starter plan: $7/month (always-on, faster)
- Professional: $25/month (more resources)

## Next Steps

1. Deploy SLAYT to Render using steps above
2. Get your Render service URL
3. Update Boveda `.env.local` with SLAYT_API_URL
4. Test integration from Boveda Studio
5. Start publishing character content to social media!

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- SLAYT Issues: https://github.com/bomac1193/Slayt/issues
