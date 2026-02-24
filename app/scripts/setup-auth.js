#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Firebase Authentication Setup Script for HomeHelp\n');

// Check if Firebase CLI is logged in
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('✅ Firebase CLI: Logged in');
} catch (error) {
  console.log('❌ Firebase CLI: Not logged in');
  console.log('Please run: firebase login');
  process.exit(1);
}

// Check current project
try {
  const projects = execSync('firebase projects:list', { encoding: 'utf8' });
  if (projects.includes('recipebook-1a8d7')) {
    console.log('✅ Firebase Project: recipebook-1a8d7 found');
  } else {
    console.log('❌ Firebase Project: recipebook-1a8d7 not found');
    console.log('Please ensure you have access to the Annapurna Firebase project');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error checking Firebase projects');
  process.exit(1);
}

// Instructions for manual setup
console.log('\n📋 Manual Setup Required:');
console.log('\n1️⃣ Open Firebase Console Authentication:');
console.log('   🔗 https://console.firebase.google.com/project/recipebook-1a8d7/authentication');

console.log('\n2️⃣ Enable Google Sign-In:');
console.log('   • Click on "Google" provider');
console.log('   • Click "Enable"');
console.log('   • Add authorized domains:');
console.log('     - localhost');
console.log('     - *.vercel.app');
console.log('     - annapurna-eight.vercel.app');
console.log('     - annapurna-alpha.vercel.app');

console.log('\n3️⃣ Enable Apple Sign-In:');
console.log('   • Click on "Apple" provider');
console.log('   • Click "Enable"');
console.log('   • Configure with:');
console.log('     - Team ID: Your Apple Developer Team ID');
console.log('     - Bundle ID: com.homehelp.app');
console.log('     - Service ID: Create new service ID');

console.log('\n4️⃣ Get Google iOS Client ID:');
console.log('   • Go to Project Settings → General');
console.log('   • Click "Add app" → iOS');
console.log('   • Bundle ID: com.homehelp.app');
console.log('   • App nickname: HomeHelp iOS');
console.log('   • Download GoogleService-Info.plist');
console.log('   • Copy the REVERSED_CLIENT_ID from the plist');

console.log('\n5️⃣ Update .env file:');
console.log('   Add this line to .env:');
console.log('   GOOGLE_IOS_CLIENT_ID=your-reversed-client-id-here');

console.log('\n6️⃣ Update iOS Configuration:');
console.log('   • Open ios/HomeHelp.xcworkspace in Xcode');
console.log('   • Add "Sign In with Apple" capability');
console.log('   • Update Bundle Identifier to "com.homehelp.app"');

// Check current .env and show what to add
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('GOOGLE_IOS_CLIENT_ID=')) {
    console.log('\n📝 Add to .env file:');
    console.log('   GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id-here');
  } else {
    console.log('\n✅ GOOGLE_IOS_CLIENT_ID already configured in .env');
  }
}

// Create a checklist file
const checklist = `
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
`;

fs.writeFileSync(path.join(__dirname, '../AUTH_SETUP_CHECKLIST.md'), checklist);
console.log('\n📋 Created AUTH_SETUP_CHECKLIST.md with detailed steps');

console.log('\n🚀 Ready to test!');
console.log('After completing the setup above, run:');
console.log('npx expo start --ios');
console.log('\n📱 Use the Debug Screen in Settings to monitor authentication logs');
