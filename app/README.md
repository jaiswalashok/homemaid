# HomeHelp 🏠

Your Smart Home Assistant — a React Native Expo app that replicates and extends the [Annapurna](../annapurna) Next.js project with mobile-first features.

## Features

- **Task Management** — Daily task templates, urgent tasks, real-time progress tracking with timers, carry-over from previous days
- **AI Recipe Creation** — Describe any dish in natural language; Gemini AI parses it into structured bilingual (English/Hindi) recipes with auto-generated images
- **Expense Tracking** — Manual entry or scan receipts with AI-powered parsing via camera
- **Grocery Lists** — Add items manually or via AI formatting; toggle purchased status; clear purchased items
- **Bilingual Support** — Full English and Hindi UI with language toggle
- **Authentication** — Email/password with verification code, Apple Sign-In, Google Sign-In
- **Firebase Backend** — Firestore for data, Firebase Auth for users, Firebase Storage for images

## Tech Stack

- **React Native** with **Expo SDK 54**
- **Firebase** (Auth, Firestore, Storage)
- **React Navigation** (Bottom Tabs + Native Stack)
- **Lucide React Native** (Icons)
- **Expo Modules** (Image Picker, Apple Auth, Auth Session, AV, Crypto)

## Prerequisites

1. **Node.js** >= 18
2. **Expo CLI** — `npm install -g expo-cli`
3. **Annapurna Next.js server** running on `http://localhost:3000` (for AI APIs)

## Getting Started

```bash
# Install dependencies
cd HomeHelp
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## Project Structure

```
HomeHelp/
├── App.tsx                          # Root component with auth flow
├── app.json                         # Expo configuration
├── app.config.ts                    # Dynamic Expo config with env vars
├── .env                             # Environment variables
├── src/
│   ├── config/
│   │   ├── firebase.ts              # Firebase initialization
│   │   └── theme.ts                 # Colors, spacing, radius constants
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication state & methods
│   │   └── LanguageContext.tsx       # Bilingual language support
│   ├── navigation/
│   │   └── MainTabNavigator.tsx     # Bottom tab navigator
│   ├── screens/
│   │   ├── SplashScreen.tsx         # App splash screen
│   │   ├── AuthScreen.tsx           # Sign in / Sign up
│   │   ├── VerifyScreen.tsx         # Email verification code
│   │   ├── CompleteProfileScreen.tsx # Profile completion
│   │   ├── TasksScreen.tsx          # Daily task management
│   │   ├── RecipesScreen.tsx        # AI recipe creation & browsing
│   │   ├── ExpensesScreen.tsx       # Expense tracking & receipt scanning
│   │   ├── GroceryScreen.tsx        # Grocery list management
│   │   └── SettingsScreen.tsx       # Profile, language, sign out
│   ├── services/
│   │   ├── api.ts                   # API calls to Next.js backend
│   │   ├── tasks.ts                 # Firestore task operations
│   │   ├── recipes.ts               # Firestore recipe operations
│   │   ├── expenses.ts              # Firestore expense operations
│   │   └── grocery.ts               # Firestore grocery operations
│   └── utils/
│       └── helpers.ts               # Utility functions
├── assets/                          # App icons and splash images
└── scripts/
    └── generate-icons.js            # Icon generation guide
```

## API Endpoints (Annapurna Backend)

The app connects to the Annapurna Next.js server for AI features:

| Endpoint | Method | Description |
|---|---|---|
| `/api/gemini/parse-recipe` | POST | Parse natural language into structured recipe |
| `/api/gemini/generate-image` | POST | Generate photorealistic dish image |
| `/api/gemini/translate` | POST | Translate text between languages |
| `/api/gemini/follow-along` | POST | Generate cooking follow-along script |
| `/api/gemini/parse-receipt` | POST | Parse receipt image into expense data |
| `/api/gemini/format-grocery` | POST | Format grocery items with emoji |
| `/api/speech/transcribe` | POST | Speech-to-text |
| `/api/speech/synthesize` | POST | Text-to-speech |
| `/api/mobile/send-verification` | POST | Send email verification code |
| `/api/mobile/send-welcome` | POST | Send welcome email |

## Authentication Flow

1. **Email/Password**: User enters email + name → verification code sent → user enters code + password → account created
2. **Apple Sign-In**: Native Apple authentication → Firebase credential → profile check
3. **Google Sign-In**: OAuth flow via expo-auth-session → Firebase credential → profile check
4. **Profile Completion**: If social sign-in lacks name, user completes profile before accessing app

## Environment Variables

Create a `.env` file (already included with defaults):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
API_BASE_URL=http://localhost:3000
```

## Firestore Collections

- `users` — User profiles
- `tasks` — Daily and custom tasks
- `dailyTaskTemplates` — Reusable daily task templates
- `recipes` — Bilingual recipes with images
- `expenses` — Expense records with receipt data
- `groceries` — Grocery list items
- `verifications` — Email verification codes

## License

Private — All rights reserved.
