# Fix Apple Sign-In: auth/operation-not-allowed

## Issue
```
Firebase: Error (auth/operation-not-allowed)
```

This error means Apple Sign-In is not fully configured in Firebase Console.

## ✅ Quick Fix

### Step 1: Verify Apple Sign-In Configuration

**Go to:** https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers

1. Click on **"Apple"** row
2. Check if it's **Enabled** (should show green checkmark)
3. If enabled, click on it to see configuration details

### Step 2: Check Required Configuration

Apple Sign-In requires additional setup beyond just toggling it on:

**For Web (localhost testing):**
- Apple Sign-In works differently on web vs mobile
- For **localhost testing**, Apple Sign-In may not work properly
- Apple requires HTTPS for web authentication

**Recommended: Test with Google Sign-In first**
- Google Sign-In works on localhost
- Apple Sign-In works best on mobile or deployed HTTPS sites

### Step 3: If You Need Apple Sign-In on Web

**Option A: Test on deployed site (recommended)**
1. Deploy to Vercel (HTTPS)
2. Add your Vercel domain to Firebase authorized domains
3. Test Apple Sign-In on production

**Option B: Configure Apple Developer Account (advanced)**
1. Need Apple Developer account ($99/year)
2. Create Services ID
3. Configure OAuth redirect URLs
4. Add credentials to Firebase Console

See `ENABLE_FIREBASE_AUTH_CLI.md` for detailed Apple setup.

---

## 🧪 Test Now

### Test Google Sign-In (works on localhost):
```bash
# Visit http://localhost:3000/login
# Click "Continue with Google"
# Should work ✅
```

### Test Email Sign-In (works on localhost):
```bash
# Visit http://localhost:3000/login?mode=signup
# Enter email, password, name
# Send verification code
# Enter code
# Should work ✅
```

### Test Apple Sign-In:
**On localhost:** May not work due to HTTPS requirement
**On deployed site:** Will work if properly configured

---

## 📝 Summary

**Working on localhost:**
- ✅ Email/Password signup with verification
- ✅ Google Sign-In
- ❌ Apple Sign-In (requires HTTPS)

**To enable Apple Sign-In:**
1. Deploy to Vercel (HTTPS)
2. Or configure Apple Developer account for localhost testing
3. Or skip Apple Sign-In for now and use Google/Email

---

## 🚀 Recommended Next Steps

1. **Test email signup** - Should work now with avatar generation
2. **Test Google Sign-In** - Should work on localhost
3. **Deploy to Vercel** - Then test Apple Sign-In on production
4. **Configure Apple Developer** - Only if you need Apple Sign-In on localhost

---

**For now, focus on email and Google authentication which work on localhost.**
