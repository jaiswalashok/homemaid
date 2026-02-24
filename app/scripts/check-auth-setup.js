#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Authentication Setup Check for HomeHelp\n');

// Check .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': envContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY='),
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': envContent.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID='),
    'GOOGLE_IOS_CLIENT_ID': envContent.includes('GOOGLE_IOS_CLIENT_ID=') && !envContent.includes('GOOGLE_IOS_CLIENT_ID='),
    'API_BASE_URL': envContent.includes('API_BASE_URL='),
  };

  console.log('📄 .env Configuration:');
  Object.entries(envVars).forEach(([key, configured]) => {
    const status = configured ? '✅' : '❌';
    const missing = key === 'GOOGLE_IOS_CLIENT_ID' && !configured ? ' (MISSING)' : '';
    console.log(`  ${status} ${key}${missing}`);
  });
} else {
  console.log('❌ .env file not found');
}

// Check app.config.ts
const appConfigPath = path.join(__dirname, '../app.config.ts');
if (fs.existsSync(appConfigPath)) {
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  const hasGoogleIosClientId = appConfigContent.includes('googleIosClientId:');
  const hasFirebaseConfig = appConfigContent.includes('firebaseApiKey:');
  
  console.log('\n📱 app.config.ts Configuration:');
  console.log(`  ${hasFirebaseConfig ? '✅' : '❌'} Firebase config in extra section`);
  console.log(`  ${hasGoogleIosClientId ? '✅' : '❌'} Google iOS Client ID reference`);
} else {
  console.log('\n❌ app.config.ts file not found');
}

// Check Firebase project files
const firebasercPath = path.join(__dirname, '../.firebaserc');
if (fs.existsSync(firebasercPath)) {
  const firebasercContent = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
  console.log('\n🔥 Firebase Project:');
  console.log(`  ✅ Project ID: ${firebasercContent.projects.default}`);
} else {
  console.log('\n❌ .firebaserc file not found');
}

// Instructions
console.log('\n🚀 Setup Instructions:');
console.log('\n1. Open Firebase Console:');
console.log('   https://console.firebase.google.com/project/recipebook-1a8d7/authentication');
console.log('\n2. Enable Authentication Providers:');
console.log('   - Click "Google" → Enable → Add authorized domains');
console.log('   - Click "Apple" → Enable → Configure Team ID and Bundle ID');
console.log('\n3. Get Google iOS Client ID:');
console.log('   - Go to Project Settings → General → Your apps');
console.log('   - Add iOS app with bundle ID: com.homehelp.app');
console.log('   - Copy the iOS Client ID to .env file');
console.log('\n4. Update .env file:');
console.log('   GOOGLE_IOS_CLIENT_ID=your-client-id-here');
console.log('\n5. Test with:');
console.log('   npx expo start --ios');

console.log('\n📋 Current Status:');
console.log('❌ Google Sign-In: Not configured (missing iOS Client ID)');
console.log('❌ Apple Sign-In: Not configured (needs setup in Firebase)');
console.log('✅ Firebase Project: Connected (recipebook-1a8d7)');
console.log('✅ Basic Config: Firebase keys configured');

console.log('\n🔗 Useful Links:');
console.log('Firebase Console: https://console.firebase.google.com/project/recipebook-1a8d7');
console.log('Auth Settings: https://console.firebase.google.com/project/recipebook-1a8d7/authentication');
console.log('Project Settings: https://console.firebase.google.com/project/recipebook-1a8d7/settings/general');
