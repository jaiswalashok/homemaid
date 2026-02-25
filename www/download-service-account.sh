#!/bin/bash

# Download Firebase Service Account Key
# This script downloads the service account key for Firebase Admin SDK

echo "📥 Downloading Firebase Service Account Key..."
echo ""

# Open the Firebase Console service accounts page
echo "Opening Firebase Console..."
echo "URL: https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk"
echo ""
echo "Steps:"
echo "1. Click 'Generate new private key'"
echo "2. Click 'Generate key' in the dialog"
echo "3. Save the JSON file as 'service-account-key.json' in the www directory"
echo ""
echo "After downloading, run:"
echo "  echo 'FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json' >> .env"
echo ""

# Open the URL
open "https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk"
