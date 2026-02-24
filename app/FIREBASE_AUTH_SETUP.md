# Firebase Authentication Setup Guide for HomeHelp

## Current Status
- ✅ Firebase Project: `recipebook-1a8d7` (Annapurna)
- ✅ Firebase Web App configured
- ❌ Google iOS Client ID: Missing
- ❌ Apple Sign-In: Needs verification
- ❌ Authentication providers: Need configuration

## Required Setup Steps

### 1. Open Firebase Console
```bash
# This should open the authentication section
open https://console.firebase.google.com/project/recipebook-1a8d7/authentication
```

### 2. Enable Authentication Providers

#### Google Sign-In Setup
1. In Firebase Console → Authentication → Sign-in method
2. Click "Google" → Enable
3. Add authorized domains:
   - `localhost` (for development)
   - `*.vercel.app` (for production)
4. Download configuration and update `GOOGLE_IOS_CLIENT_ID`

#### Apple Sign-In Setup
1. In Firebase Console → Authentication → Sign-in method
2. Click "Apple" → Enable
3. Configure Apple Team ID and Bundle ID:
   - Bundle ID: `com.homehelp.app`
4. Add Service ID configuration

### 3. Update Environment Variables

Add to `.env` file:
```env
# Missing - Get from Firebase Console → Project Settings → General
GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id-here
GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id-here

# Apple Sign-In (if applicable)
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_SERVICE_ID=your-apple-service-id
```

### 4. Update App Configuration

Update `app.config.ts` to include missing client IDs:
```typescript
extra: {
  // ... existing config
  googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
}
```

### 5. iOS Configuration (Xcode)
For Apple Sign-In on iOS:
1. Open `ios/HomeHelp.xcworkspace` in Xcode
2. Go to Signing & Capabilities
3. Add "Sign In with Apple" capability
4. Update Bundle Identifier to `com.homehelp.app`

### 6. Test Configuration

After setup, test with:
```bash
# Check Firebase auth status
npx expo start --ios
# Try signing in with Google and Apple
```

## Verification Commands

### Check Firebase Project
```bash
firebase projects:list
firebase use recipebook-1a8d7
firebase apps:list
```

### Check Current Config
```bash
cat .env
cat app.config.ts
```

## Troubleshooting

### Google Sign-In Issues
- Ensure OAuth consent screen is configured
- Verify client IDs match between Firebase and app config
- Check authorized domains list

### Apple Sign-In Issues
- Verify Apple Developer account
- Check Bundle ID matches Firebase configuration
- Ensure Service ID is properly configured

### Common Errors
- "INVALID_CLIENT_ID" → Update Google client IDs
- "MISSING_IOS_BUNDLE_ID" → Update app.config.ts bundle ID
- "NETWORK_ERROR" → Check Firebase project configuration

## Current Firebase Configuration

```json
{
  "apiKey": "AIzaSyDDrlOXgU4_X7omqnTyugYjoGlltjahz0E",
  "authDomain": "recipebook-1a8d7.firebaseapp.com",
  "projectId": "recipebook-1a8d7",
  "storageBucket": "recipebook-1a8d7.firebasestorage.app",
  "messagingSenderId": "37849751232",
  "appId": "1:37849751232:web:e44a74d369181778039725",
  "measurementId": "G-YJ8MERM2CB"
}
```

## Next Steps

1. 🔥 Open Firebase Console and enable providers
2. 📱 Get Google iOS Client ID
3. 🍎 Configure Apple Sign-In
4. 🔧 Update environment variables
5. ✅ Test authentication flows
