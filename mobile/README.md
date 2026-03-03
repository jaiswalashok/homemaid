# HomeMaid Mobile App

React Native mobile application for HomeMaid - your home management assistant.

## Features

- **Authentication**: Email/password login, signup with email verification, forgot password
- **Tasks Management**: Daily tasks, task templates, task completion tracking
- **Expense Tracking**: Receipt scanning with AI, manual expense entry, item-wise breakdown, analytics
- **Recipe Management**: Add recipes with photos, ingredient lists, cooking instructions
- **Grocery List**: Shopping list with purchase tracking
- **Multi-language**: English and Hindi support
- **Offline Persistence**: AsyncStorage for auth and preferences

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini for receipt parsing
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data

## Project Structure

```
mobile/
├── src/
│   ├── contexts/          # React contexts (Auth, Language)
│   ├── lib/              # Firebase and API utilities
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # App screens
│   │   ├── auth/        # Authentication screens
│   │   ├── DashboardScreen.tsx
│   │   ├── ExpensesScreen.tsx
│   │   ├── RecipesScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── GroceryScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── types/           # TypeScript type definitions
├── App.tsx              # Root component
├── app.json            # Expo configuration
└── .env                # Environment variables
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
cd mobile
pnpm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (already configured)
   - Update Firebase credentials if needed

3. Start the development server:
```bash
pnpm start
```

4. Run on platform:
```bash
# iOS
pnpm run ios

# Android
pnpm run android

# Web (for testing)
pnpm run web
```

## Environment Variables

All environment variables use the `EXPO_PUBLIC_` prefix for Expo:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GEMINI_API_KEY`

## Features Detail

### Receipt Scanning
- Take photo with camera or choose from gallery
- AI-powered parsing using Google Gemini
- Extracts vendor, items, prices, payment method, date
- Automatic categorization and emoji assignment

### Task Management
- Daily task templates with frequency settings
- Auto-seeding of daily tasks
- Task completion tracking
- Date-based task organization

### Expense Analytics
- Total spending summary
- Category breakdown
- Item-level analytics (top purchased items)
- Purchase frequency and average price tracking

### Recipe Management
- Photo upload for recipes
- Ingredient lists
- Cooking instructions
- Firebase Storage integration

## Building for Production

### iOS

1. Configure bundle identifier in `app.json`
2. Build:
```bash
eas build --platform ios
```

### Android

1. Configure package name in `app.json`
2. Build:
```bash
eas build --platform android
```

## Permissions

The app requires the following permissions:

- **Camera**: For receipt scanning and recipe photos
- **Photo Library**: For selecting images from gallery
- **Microphone**: For voice input (future feature)

## Firebase Configuration

The app uses the same Firebase project as the web app:
- Project ID: `homemaid-f7a6e`
- Firestore collections: `tasks`, `dailyTaskTemplates`, `recipes`, `expenses`, `groceries`
- Storage buckets: `recipes/`, `profiles/`

## Security

- All Firestore queries include `userId` filtering
- Firebase Security Rules enforce user-specific data access
- Email verification required for full access
- AsyncStorage used for secure auth persistence

## Language Support

Toggle between English and Hindi in the Profile screen. Language preference is persisted locally.

## Troubleshooting

### TypeScript errors on first run
- Wait for TypeScript server to index all files
- Restart TypeScript server in your IDE

### Firebase connection issues
- Verify `.env` file exists and has correct values
- Check Firebase project configuration
- Ensure Firestore rules are deployed

### Camera not working
- Check permissions in `app.json`
- Grant camera access in device settings
- Test on physical device (simulators have limited camera support)

## Development

### Adding a new screen
1. Create screen component in `src/screens/`
2. Add route to `src/navigation/AppNavigator.tsx`
3. Update tab bar icons if needed

### Adding a new Firestore collection
1. Create type in `src/types/index.ts`
2. Create lib file in `src/lib/` with CRUD operations
3. Update Firestore rules in main project

## License

Private - Jaiswals Family Project
