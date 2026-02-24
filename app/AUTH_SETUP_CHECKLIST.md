
# Firebase Authentication Setup Checklist

## Firebase Console Setup
- [ ] Open: https://console.firebase.google.com/project/recipebook-1a8d7/authentication
- [ ] Enable Google Sign-In provider
- [ ] Enable Apple Sign-In provider
- [ ] Add authorized domains to Google provider
- [ ] Configure Apple Team ID and Bundle ID

## Google iOS App Setup
- [ ] Go to Project Settings → General
- [ ] Add iOS app with bundle ID: com.homehelp.app
- [ ] Download GoogleService-Info.plist
- [ ] Get REVERSED_CLIENT_ID from plist
- [ ] Add GOOGLE_IOS_CLIENT_ID to .env file

## iOS Configuration
- [ ] Open ios/HomeHelp.xcworkspace in Xcode
- [ ] Add "Sign In with Apple" capability
- [ ] Update Bundle Identifier to com.homehelp.app
- [ ] Add GoogleService-Info.plist to iOS project

## Testing
- [ ] Run: npx expo start --ios
- [ ] Test Google Sign-In flow
- [ ] Test Apple Sign-In flow
- [ ] Test email/password sign-up
- [ ] Check debug logs for any errors

## Troubleshooting
- Google Sign-In errors: Check client IDs and authorized domains
- Apple Sign-In errors: Verify Team ID and Bundle ID match
- Network errors: Check Firebase project configuration
