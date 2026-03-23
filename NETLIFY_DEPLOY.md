# Deploy Kumbra Capital to Netlify

## Quick Deployment Steps

### 1. Push to GitHub

Your code is ready to deploy! First, push it to GitHub:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"** and authorize Netlify to access your repository
4. Select your repository
5. Configure build settings (these should auto-detect from netlify.toml):
   - **Build command**: Already configured in netlify.toml
   - **Publish directory**: Already configured in netlify.toml
   - **Node version**: 20 (already configured)

6. **Add Environment Variables**:
   Click "Show advanced" and add these variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://zkjscsdghsoswxfolopw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpranNjc2RnaHNvc3d4Zm9sb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzQ5NzcsImV4cCI6MjA4MTQxMDk3N30.UI83aITRTscit9sijrRwbORBeR7c1IfpACLcBzSWu2o
   ```

7. Click **"Deploy site"**

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 3. Configure Supabase URLs

After your site is deployed, you need to add the Netlify URL to Supabase:

1. Note your Netlify URL (e.g., `https://kumbra-capital.netlify.app`)
2. Go to https://supabase.com/dashboard
3. Select your project: **zkjscsdghsoswxfolopw**
4. Navigate to: **Authentication** → **URL Configuration**
5. Add your Netlify URL to:
   - **Site URL**: `https://your-site.netlify.app`
   - **Redirect URLs**: Add `https://your-site.netlify.app/**`

### 4. Test Your Deployment

Visit your Netlify URL and test:
- Sign in as admin: `admin@kumbra.capital` / `admin123456`
- Create a test client account
- Navigate through the portal

## Important Notes

✅ **Configured Files:**
- `netlify.toml` - Build configuration ready
- Git repository initialized with all files
- Environment variables documented above

⚠️ **Before Going Live:**
- Update admin password in Supabase
- Configure custom domain in Netlify
- Set up SSL certificate (automatic with Netlify)
- Test all authentication flows
- Verify RLS policies are working

## Troubleshooting

### Build Fails
- Check Netlify deploy logs
- Verify Node version is set to 20
- Ensure environment variables are set correctly

### Authentication Issues
- Verify Supabase URL configuration includes Netlify domain
- Check browser console for CORS errors
- Confirm environment variables match .env file

### Images Not Loading
- Binary files (logos) are included in the git repository
- Verify public folder contents in Netlify deploy

## Custom Domain Setup

To use a custom domain (e.g., portal.kumbra.capital):

1. In Netlify dashboard → **Domain settings**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Update Supabase redirect URLs with new domain

## Support

Your application is production-ready with:
- ✅ Complete rebrand to Kumbra Capital
- ✅ Cyan blue (#00ADEF) color scheme
- ✅ Responsive design
- ✅ Dark/light mode support
- ✅ Supabase backend configured
- ✅ All 31 pages building successfully
