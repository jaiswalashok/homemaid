# Enable Firebase Authentication Methods

The `auth/operation-not-allowed` error occurs because the authentication methods are not enabled in Firebase Console.

## 🔧 Quick Fix - Enable Authentication Methods

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
   - Or: Firebase Console → Authentication → Sign-in method

2. **Enable Email/Password Authentication**
   - Click on "Email/Password" provider
   - Toggle "Enable" to ON
   - Click "Save"

3. **Enable Google Authentication**
   - Click on "Google" provider
   - Toggle "Enable" to ON
   - **Project support email:** ashok@jaiswals.live
   - Click "Save"

4. **Enable Apple Authentication**
   - Click on "Apple" provider
   - Toggle "Enable" to ON
   - You'll need:
     - **Services ID:** (from Apple Developer Console)
     - **Team ID:** (from Apple Developer Console)
     - **Key ID:** (from Apple Developer Console)
     - **Private Key:** (download from Apple Developer Console)
   - Click "Save"

### Method 2: Using Firebase CLI

If you're logged in with Firebase CLI, you can check the current configuration:

```bash
# Login to Firebase
firebase login

# List projects
firebase projects:list

# Use the homemaid project
firebase use homemaid-f7a6e

# Check authentication config (view only)
firebase auth:export users.json --project homemaid-f7a6e
```

**Note:** Authentication provider configuration must be done through the Firebase Console web interface.

## 📋 Current Authentication Setup

### Enabled Providers (Need to Enable)
- ✅ Email/Password (with email verification)
- ✅ Google OAuth
- ✅ Apple Sign-In

### Configuration Details

**Email/Password:**
- Email verification required for signup
- 4-digit verification code sent via Resend API
- Password reset via Firebase

**Google OAuth:**
- Web Client ID: `852963733478-7mvfga75t3ms7k1khhkh36g6oq4pesnj.apps.googleusercontent.com`
- iOS Client ID: `852963733478-a7tbn0q97asv4o056fla0onjtidcvv1a.apps.googleusercontent.com`
- Android Client ID: `852963733478-7mvfga75t3ms7k1khhkh36g6oq4pesnj.apps.googleusercontent.com`

**Apple Sign-In:**
- Requires Apple Developer Account
- Bundle ID: `live.jaiswals.homemaid`
- Scopes: email, name

## 🍎 Apple Sign-In Setup (Detailed)

### Step 1: Apple Developer Console Setup

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Create a new **Services ID**:
   - Description: HomeMaid Web
   - Identifier: `live.jaiswals.homemaid.web` (or similar)
   - Enable "Sign In with Apple"
   - Configure domains and return URLs:
     - Domains: `homemaid-f7a6e.firebaseapp.com`
     - Return URLs: `https://homemaid-f7a6e.firebaseapp.com/__/auth/handler`

3. Create a **Key** for Apple Sign-In:
   - Key Name: HomeMaid Apple Sign-In Key
   - Enable "Sign In with Apple"
   - Download the `.p8` key file (only available once!)
   - Note the Key ID

4. Get your **Team ID**:
   - Found in Apple Developer Account → Membership

### Step 2: Configure in Firebase Console

1. Go to Firebase Console → Authentication → Sign-in method
2. Click on "Apple"
3. Enter:
   - **Services ID:** `live.jaiswals.homemaid.web`
   - **Apple Team ID:** (from Apple Developer)
   - **Key ID:** (from the key you created)
   - **Private Key:** (paste contents of .p8 file)
4. Click "Save"

### Step 3: Update OAuth Redirect URI in Apple

Copy the OAuth redirect URI from Firebase Console and add it to your Apple Services ID configuration.

## 🧪 Testing Authentication

### Test Email/Password
```bash
# Visit the login page
open http://localhost:3000/login

# Try signing up with email
# You should receive a verification code email
```

### Test Google Sign-In
```bash
# Click "Continue with Google"
# Should open Google OAuth popup
# Select account and authorize
```

### Test Apple Sign-In
```bash
# Click "Continue with Apple"
# Should open Apple OAuth popup
# Sign in with Apple ID
```

## 🐛 Troubleshooting

### Error: `auth/operation-not-allowed`
**Solution:** Enable the authentication provider in Firebase Console

### Error: `auth/unauthorized-domain`
**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains
- Add: `localhost`
- Add: `jaiswals.live`

### Error: `auth/popup-blocked`
**Solution:** Allow popups in browser settings for localhost and jaiswals.live

### Apple Sign-In Not Working
**Checklist:**
- [ ] Services ID created in Apple Developer Console
- [ ] Sign In with Apple enabled for Services ID
- [ ] Domains and return URLs configured correctly
- [ ] Key created and downloaded
- [ ] All credentials entered in Firebase Console
- [ ] OAuth redirect URI added to Apple Services ID

## 📞 Support

If you encounter issues:
- Email: ashok@jaiswals.live
- Firebase Project: homemaid-f7a6e
- Firebase Console: https://console.firebase.google.com/project/homemaid-f7a6e

## ✅ Verification Checklist

After enabling authentication methods:

- [ ] Email/Password enabled in Firebase Console
- [ ] Google OAuth enabled in Firebase Console
- [ ] Apple Sign-In configured (if needed)
- [ ] Authorized domains added (localhost, jaiswals.live)
- [ ] Test email signup and verification code
- [ ] Test Google Sign-In
- [ ] Test Apple Sign-In (if configured)
- [ ] Verify user profile creation in Firestore

---

**Last Updated:** 2026-02-24  
**Project:** HomeMaid by Jaiswals Family
