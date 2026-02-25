# Download Firebase Service Account Key

The Firebase Admin SDK needs a service account key to work properly.

## 🔑 Download Service Account Key (2 minutes)

### Step 1: Open Firebase Console
**Direct Link:** https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk

### Step 2: Generate Private Key
1. Click **"Generate new private key"** button
2. Click **"Generate key"** in the confirmation dialog
3. A JSON file will download: `homemaid-f7a6e-firebase-adminsdk-xxxxx.json`

### Step 3: Save the Key
```bash
# Move the downloaded file to your project
mv ~/Downloads/homemaid-f7a6e-firebase-adminsdk-*.json /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www/service-account-key.json
```

### Step 4: Add to .env
```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid

# Add the service account to .env
echo 'FIREBASE_SERVICE_ACCOUNT=$(cat www/service-account-key.json)' >> .env
```

Or manually add to `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"homemaid-f7a6e",...}
```

### Step 5: Add to .gitignore
```bash
echo 'service-account-key.json' >> www/.gitignore
```

### Step 6: Restart Server
```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www
pnpm dev
```

---

## 🧪 Test After Setup

Visit http://localhost:3000/login?mode=signup and try:
1. Enter email, password, name
2. Click "Send Verification Code"
3. Should work now!

---

## 🔒 Security Notes

- ✅ Service account key is in `.gitignore`
- ✅ Never commit this file to GitHub
- ✅ For production, use Vercel environment variables

---

## 📝 Alternative: Use Environment Variable

Instead of a file, you can paste the entire JSON as an environment variable:

1. Copy the contents of the service account JSON file
2. Add to `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"homemaid-f7a6e","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

This is the recommended approach for deployment.

---

**Link to download:** https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk
