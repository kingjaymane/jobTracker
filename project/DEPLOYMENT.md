# Production Deployment Guide

This guide covers deploying JobTracker to production with Vercel and configuring all necessary services.

## 🚀 Deployment Checklist

### 1. Environment Setup

#### Google Cloud Console
1. **Create/Configure Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable billing (required for Gmail API)

2. **Enable APIs**:
   ```bash
   # Enable Gmail API
   gcloud services enable gmail.googleapis.com
   ```

3. **Create OAuth 2.0 Credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://yourdomain.com/api/auth/gmail/callback`
   - Download the credentials JSON

#### Firebase Setup
1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Google Analytics (optional)

2. **Enable Services**:
   - **Authentication**: Enable Email/Password and Google providers
   - **Firestore**: Create database in production mode
   - **Hosting** (optional): For static assets

3. **Configure Security Rules**:
   ```javascript
   // Firestore Security Rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/jobs/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

### 2. Vercel Deployment

#### Initial Setup
1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**:
   ```bash
   # Build Command
   npm run build
   
   # Output Directory
   .next
   
   # Install Command
   npm install
   ```

#### Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Gmail Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BASE_URL=https://yourdomain.vercel.app

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Domain Configuration

#### Custom Domain (Optional)
1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update OAuth Redirect URIs**:
   - Update Google Cloud Console OAuth settings
   - Add new production URLs
   - Update Firebase authorized domains

3. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://yourcustomdomain.com
   ```

### 4. Security Configuration

#### CORS and Security Headers
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_BASE_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Firebase Security
1. **Update Firestore Rules**:
   - Ensure user isolation
   - Add rate limiting if needed
   - Test rules thoroughly

2. **Enable App Check** (Recommended):
   ```bash
   # Add to Firebase project
   # Protects against abuse
   ```

### 5. Monitoring and Analytics

#### Error Tracking
Consider adding Sentry or similar:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Performance Monitoring
1. **Vercel Analytics**: Enable in project settings
2. **Google Analytics**: Add to Firebase
3. **Core Web Vitals**: Monitor automatically with Vercel

### 6. Testing Production

#### Pre-deployment Tests
```bash
# Build locally
npm run build
npm start

# Test OAuth flow
# Test email scanning
# Test data persistence
# Test mobile responsiveness
```

#### Post-deployment Verification
1. **Authentication Flow**:
   - Sign up new user
   - Sign in existing user
   - Password reset flow

2. **Gmail Integration**:
   - Connect Gmail account
   - Scan for emails
   - Verify auto-import functionality
   - Test direct Gmail links

3. **Data Operations**:
   - Add manual job application
   - Edit existing applications
   - Delete applications
   - Test filtering and search

4. **UI/UX Testing**:
   - Test on mobile devices
   - Verify dark/light mode
   - Check responsive design
   - Test all interactive elements

### 7. Backup and Recovery

#### Database Backup
```bash
# Firestore export (set up scheduled exports)
gcloud firestore export gs://your-backup-bucket
```

#### Environment Variables Backup
```bash
# Save all environment variables securely
# Use a password manager or secure vault
```

### 8. Maintenance Tasks

#### Regular Updates
```bash
# Update dependencies monthly
npm update

# Security audits
npm audit
npm audit fix
```

#### Monitoring Checklist
- [ ] API response times
- [ ] Error rates
- [ ] User authentication success
- [ ] Gmail API quota usage
- [ ] Firestore read/write costs
- [ ] Vercel function execution time

### 9. Scaling Considerations

#### Database Optimization
- Index frequently queried fields
- Implement pagination for large datasets
- Consider data archiving for old applications

#### API Rate Limiting
```javascript
// Implement rate limiting for email scanning
// Consider user-based quotas
```

#### Performance Optimization
- Implement proper caching strategies
- Optimize bundle size
- Use Image optimization
- Implement lazy loading

### 10. Troubleshooting

#### Common Issues
1. **OAuth Redirect Mismatch**:
   - Verify redirect URI matches exactly
   - Check environment variables

2. **Firestore Permission Denied**:
   - Check security rules
   - Verify user authentication

3. **Gmail API Quota Exceeded**:
   - Check quota usage in Google Cloud
   - Implement request throttling

4. **Build Failures**:
   - Check for type errors
   - Verify all imports
   - Test locally first

#### Debug Mode
```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

## 📞 Support

If you encounter issues during deployment:

1. Check the Vercel deployment logs
2. Monitor browser console for client-side errors
3. Check Firebase logs for backend issues
4. Verify all environment variables are set correctly
5. Test OAuth flow in an incognito window

---

**Deployment complete! Your JobTracker is now live! 🎉**
