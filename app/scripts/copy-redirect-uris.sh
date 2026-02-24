#!/bin/bash

echo "📋 Copying OAuth Redirect URIs to Clipboard"
echo ""

# iOS OAuth Client Redirect URIs
IOS_URIS="com.ashokjaiswal.home:/oauthredirect
com.googleusercontent.apps.37849751232-j6jvm6uk4756i1mupooapp2isa7obg8q:/oauthredirect"

# Web OAuth Client Redirect URIs
WEB_REDIRECT_URIS="https://auth.expo.io/@ashokjaiswal/homehelp
http://localhost:8081
exp://localhost:8081"

# Web OAuth Client JavaScript Origins
WEB_ORIGINS="http://localhost:8081
http://localhost:19006"

echo "Choose what to copy:"
echo "1) iOS OAuth Client Redirect URIs"
echo "2) Web OAuth Client Redirect URIs"
echo "3) Web OAuth Client JavaScript Origins"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "$IOS_URIS" | pbcopy
    echo "✅ iOS Redirect URIs copied to clipboard!"
    echo ""
    echo "Paste these in Google Cloud Console:"
    echo "$IOS_URIS"
    ;;
  2)
    echo "$WEB_REDIRECT_URIS" | pbcopy
    echo "✅ Web Redirect URIs copied to clipboard!"
    echo ""
    echo "Paste these in Google Cloud Console:"
    echo "$WEB_REDIRECT_URIS"
    ;;
  3)
    echo "$WEB_ORIGINS" | pbcopy
    echo "✅ Web JavaScript Origins copied to clipboard!"
    echo ""
    echo "Paste these in Google Cloud Console:"
    echo "$WEB_ORIGINS"
    ;;
  *)
    echo "❌ Invalid choice"
    ;;
esac

echo ""
echo "📍 Steps in Google Cloud Console:"
echo "1. Click on the OAuth client you want to edit"
echo "2. Scroll to 'Authorized redirect URIs' or 'Authorized JavaScript origins'"
echo "3. Click 'ADD URI' or 'ADD ORIGIN'"
echo "4. Paste (Cmd+V) the URIs from clipboard"
echo "5. Click 'SAVE' at the bottom"
