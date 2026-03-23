# Deploying Kumbra Capital Portal to Netlify

## Prerequisites
- A Netlify account (sign up at https://netlify.com)
- Your Supabase credentials from `.env` file

## Deployment Steps

### 1. Push to GitHub (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Netlify

#### Option A: Using Netlify Dashboard (Recommended)
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18
6. Click "Show advanced" and add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://bkjrdexpyunpqcrycgca.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranJkZXhweXVucHFjcnljZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTg2NTAsImV4cCI6MjA3ODM3NDY1MH0.Ge5AtwLPuAz4hXEW2nd42Qfjsg5VtTWCec-Mu5HS_MU`
7. Click "Deploy site"

#### Option B: Using Netlify CLI
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 3. Configure Supabase URLs
After deployment, add your Netlify URL to Supabase allowed redirect URLs:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → URL Configuration
4. Add your Netlify URL (e.g., `https://your-site.netlify.app`) to:
   - Site URL
   - Redirect URLs

### 4. Test Your Deployment
1. Visit your Netlify URL
2. Try signing in with admin credentials:
   - Email: `admin@kumbra.capital`
   - Password: `admin123456`
3. Test creating a new client account via signup

## Environment Variables Reference
The following environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Troubleshooting

### Build Fails
- Ensure Node version is set to 18 or higher
- Check that all environment variables are set correctly

### Authentication Not Working
- Verify Supabase URL configuration includes your Netlify domain
- Check browser console for errors

### Blank Page After Deploy
- Check that environment variables are properly set in Netlify dashboard
- Verify the build completed successfully in the Netlify deploy logs

## Admin Access
- Email: `admin@kumbra.capital`
- Password: `admin123456`
- Admin dashboard: `https://your-site.netlify.app/admin`

## Support
For issues, check the Netlify deploy logs and browser console for error messages.
