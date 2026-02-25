# Fixes Applied for Authentication Errors

## ✅ Code Fixes Applied

### 1. Fixed Firebase Admin SDK Project ID Error
**Error:**
```
Unable to detect a Project Id in the current environment
```

**Fix Applied:**
- Updated `send-verification/route.ts` to initialize Firebase Admin with projectId
- Updated `verify-code/route.ts` to initialize Firebase Admin with projectId

**Code:**
```typescript
initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
```

---

## 🚨 REQUIRED: Enable Firebase Authentication

Both errors you're seeing are because authentication methods are **NOT enabled** in Firebase Console:

### Error 1: Email Signup
```
Firebase: Error (auth/operation-not-allowed)
```
**Cause:** Email/Password authentication is disabled

### Error 2: Apple Sign-In
```
Firebase: Error (auth/operation-not-allowed)
```
**Cause:** Apple authentication is disabled

---

## ✅ SOLUTION: Enable in Firebase Console (2 minutes)

### Direct Link:
**https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers**

### Steps:
1. **Email/Password:**
   - Click "Email/Password" → Toggle ON → Save

2. **Google:**
   - Click "Google" → Toggle ON
   - Support email: `ashok@jaiswals.live`
   - Save

3. **Apple:**
   - Click "Apple" → Toggle ON → Save

---

## 🧪 After Enabling - Restart and Test

```bash
# Restart server
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www
pnpm dev

# Test at http://localhost:3000/login
```

---

## 📝 Summary

**Code Issues:** ✅ Fixed (Firebase Admin SDK now has projectId)

**Configuration Issues:** ❌ You must enable auth providers in Firebase Console

**Time Required:** 2 minutes to enable all providers

**Link:** https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
