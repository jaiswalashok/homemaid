# Google OAuth Setup for HomeHelp

## Error: "Access blocked: Authorization Error - Error 400: invalid_request"

This error occurs because the OAuth redirect URIs need to be configured in Google Cloud Console.

## Fix Steps

### 1. Open Google Cloud Console
🔗 https://console.cloud.google.com/apis/credentials?project=recipebook-1a8d7

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - **App name**: HomeHelp
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### 3. Add Authorized Redirect URIs

For the iOS OAuth client (`37849751232-j6jvm6uk4756i1mupooapp2isa7obg8q.apps.googleusercontent.com`):

1. Go to **APIs & Services** → **Credentials**
2. Click on the iOS OAuth client ID
3. Add these **Authorized redirect URIs**:
   ```
   com.ashokjaiswal.home:/oauthredirect
   com.googleusercontent.apps.37849751232-j6jvm6uk4756i1mupooapp2isa7obg8q:/oauthredirect
   ```

For the Web OAuth client (`37849751232-vcktaqi606ra5rl52e1vkl3rslacbja5.apps.googleusercontent.com`):

1. Click on the Web OAuth client ID
2. Add these **Authorized redirect URIs**:
   ```
   http://localhost:8081
   https://auth.expo.io/@ashokjaiswal/homehelp
   exp://localhost:8081
   ```

3. Add these **Authorized JavaScript origins**:
   ```
   http://localhost:8081
   http://localhost:19006
   ```

### 4. Update Bundle ID URL Scheme

The app is already configured with:
- **Bundle ID**: `com.ashokjaiswal.home`
- **URL Scheme**: `com.ashokjaiswal.home`
- **Redirect URI**: `com.ashokjaiswal.home:/oauthredirect`

### 5. Test the Configuration

After updating Google Cloud Console:

1. Restart the Expo server:
   ```bash
   npx expo start --ios --clear
   ```

2. Try Google Sign-In again
3. Check Debug Logs in Settings for any errors

## Alternative: Use Expo's Managed OAuth Flow

If the above doesn't work, you can use Expo's managed OAuth flow:

### Update AuthScreen.tsx:
```typescript
import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'com.ashokjaiswal.home',
  path: 'oauthredirect'
});

const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
  iosClientId: googleIosClientId,
  androidClientId: googleAndroidClientId,
  webClientId: googleWebClientId,
  scopes: ['profile', 'email'],
  redirectUri: redirectUri,
});
```

Then add this redirect URI to Google Cloud Console:
```
https://auth.expo.io/@ashokjaiswal/homehelp
```

## Troubleshooting

### Error 400: redirect_uri_mismatch
- Ensure the redirect URI in the code matches exactly what's in Google Cloud Console
- Check for trailing slashes or typos
- Verify the OAuth client ID is correct

### Error 400: invalid_request
- OAuth consent screen must be configured
- Scopes must be added to the consent screen
- Test users may need to be added if app is in testing mode

### Still not working?
1. Check Google Cloud Console → APIs & Services → Credentials
2. Verify all client IDs match the ones in .env
3. Ensure OAuth consent screen is published (or add test users)
4. Clear Expo cache: `npx expo start --clear`

## Current Configuration

**iOS Client ID**: `37849751232-j6jvm6uk4756i1mupooapp2isa7obg8q.apps.googleusercontent.com`
**Android Client ID**: `37849751232-vcktaqi606ra5rl52e1vkl3rslacbja5.apps.googleusercontent.com`
**Web Client ID**: `37849751232-vcktaqi606ra5rl52e1vkl3rslacbja5.apps.googleusercontent.com`

**Bundle ID (iOS)**: `com.ashokjaiswal.home`
**Package Name (Android)**: `com.ashokjaiswal.homehelp`

**Redirect URI**: `com.ashokjaiswal.home:/oauthredirect`
