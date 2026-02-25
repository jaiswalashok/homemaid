# Environment Configuration Guide

This document explains how environment variables are organized and used across the HomeMaid project.

## 📁 Project Structure

```
HomeMaid/
├── .env                    # Root environment file (gitignored)
├── .env.example           # Template with all variables
├── www/                   # Next.js web application
│   └── (uses NEXT_PUBLIC_* variables)
└── app/                   # React Native mobile app
    └── (uses variables via app.config.ts)
```

## 🔑 Centralized Environment Variables

**All environment variables are defined in the root `.env` file** and shared between:
- Next.js web app (`www/`)
- React Native mobile app (`app/`)

### How It Works

1. **Root `.env` file** - Single source of truth for all environment variables
2. **Next.js** - Automatically reads `NEXT_PUBLIC_*` variables from root `.env`
3. **React Native** - Reads variables via `app.config.ts` which accesses `process.env`

## 🔧 Setup Instructions

### 1. Create Your `.env` File

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env  # or use your preferred editor
```

### 2. Required Variables

#### Firebase Configuration (REQUIRED)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDG8DERJYft9tsWUO4HuiWSNlBASxZn_oM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=homemaid-f7a6e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=homemaid-f7a6e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=homemaid-f7a6e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=852963733478
NEXT_PUBLIC_FIREBASE_APP_ID=1:852963733478:web:d20626e0a5b61732bff027
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5L89YPTNZ8
```

#### Google OAuth (REQUIRED for mobile app)
```bash
GOOGLE_IOS_CLIENT_ID=852963733478-a7tbn0q97asv4o056fla0onjtidcvv1a.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=852963733478-7mvfga75t3ms7k1khhkh36g6oq4pesnj.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=852963733478-7mvfga75t3ms7k1khhkh36g6oq4pesnj.apps.googleusercontent.com
```

#### Google AI (REQUIRED)
```bash
GOOGLE_AI_API_KEY=your_actual_google_ai_api_key
```

#### Email Service (REQUIRED for email features)
```bash
RESEND_API_KEY=your_actual_resend_api_key
RESEND_FROM_EMAIL=noreply@jaiswals.live
```

#### Application URLs
```bash
NEXT_PUBLIC_APP_URL=https://jaiswals.live
API_BASE_URL=https://jaiswals.live
```

### 3. Optional Variables

See `.env.example` for optional variables like:
- Telegram bot configuration
- AWS S3 storage
- Redis caching
- Monitoring/analytics

## 📱 Mobile App Configuration

The mobile app reads environment variables through `app/app.config.ts`:

```typescript
extra: {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... etc
}
```

Then accesses them in the app via:

```typescript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.firebaseApiKey;
```

## 🌐 Web App Configuration

The Next.js app directly accesses `NEXT_PUBLIC_*` variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` file in `.gitignore` (already configured)
- Use `NEXT_PUBLIC_*` prefix only for client-safe variables
- Store sensitive keys (API keys, secrets) in Vercel environment variables for production
- Use different Firebase projects for development and production

### ❌ DON'T:
- Commit `.env` file to git
- Share API keys in public repositories
- Use production keys in development

## 🚀 Deployment

### Vercel (Web App)

1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Add all `NEXT_PUBLIC_*` variables
4. Add server-side variables (RESEND_API_KEY, etc.)
5. Redeploy

### Expo (Mobile App)

For production builds, use EAS Secrets:

```bash
# Set secrets for EAS builds
eas secret:create --scope project --name NEXT_PUBLIC_FIREBASE_API_KEY --value "your-value"
```

Or use `.env.production` file (not committed to git).

## 📋 Environment Variables Checklist

Before running the project, ensure you have:

- [ ] Copied `.env.example` to `.env`
- [ ] Added Firebase configuration
- [ ] Added Google OAuth client IDs
- [ ] Added Google AI API key
- [ ] Added Resend API key (if using email)
- [ ] Updated application URLs for your domain

## 🧪 Testing Configuration

To verify your environment setup:

### Web App
```bash
cd www
npm run dev
# Check console for Firebase initialization
```

### Mobile App
```bash
cd app
npm start
# Check Expo logs for configuration loading
```

## 📞 Support

If you encounter issues with environment configuration:
- Email: ashok@jaiswals.live
- Check Firebase Console: https://console.firebase.google.com
- Review Google Cloud Console for OAuth settings

---

**Last Updated:** 2026-02-24  
**Project:** HomeMaid by Jaiswals Family
