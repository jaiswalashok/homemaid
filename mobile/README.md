# HomeMaid Mobile

React Native / Expo app for HomeMaid — mirrors the web app at [jaiswals.live](https://jaiswals.live).

## Features

- ✅ **Tasks** — Daily/weekly/monthly task scheduling with templates
- 🍳 **Recipes** — Add manually, import from URL, or paste text (AI-powered via Vercel API)
- 🧾 **Expenses** — Manual entry + receipt photo scanning (AI-powered)
- 🛒 **Grocery** — Smart list with AI parser
- 👤 **Profile** — Account management

All AI features call the Vercel-hosted API at `https://jaiswals.live/api/...` so no geo-location restrictions apply.

## Setup

### 1. Install dependencies

```bash
cd mobile
npm install
# or
pnpm install
```

### 2. Generate placeholder assets (first time only)

```bash
npm run generate-assets
```

This creates `assets/icon.png`, `assets/splash.png`, and `assets/adaptive-icon.png`.

### 3. Add Firebase service files (for native builds only)

For development with Expo Go, this is not needed.
For production builds:
- iOS: Add `GoogleService-Info.plist` to `mobile/` root
- Android: Add `google-services.json` to `mobile/` root

### 4. Start the app

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator  
npx expo start --android
```

### 5. Scan QR code with Expo Go app on your phone

## Environment Variables

Already configured in `.env`:
- Firebase credentials
- Gemini API key  
- App URL (`https://jaiswals.live`)
- Google OAuth client IDs

## Architecture

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with AuthProvider
│   ├── index.tsx           # Auth redirect guard
│   ├── (auth)/             # Unauthenticated screens
│   │   ├── landing.tsx     # Welcome/onboarding
│   │   ├── login.tsx       # Email/password login
│   │   └── signup.tsx      # New account creation
│   └── (tabs)/             # Main app tabs
│       ├── tasks.tsx       # Daily task management
│       ├── recipes.tsx     # Recipe library
│       ├── expenses.tsx    # Expense tracking
│       ├── grocery.tsx     # Grocery list
│       └── profile.tsx     # Account settings
├── src/
│   └── lib/
│       ├── firebase.ts     # Firebase init
│       ├── auth-context.tsx # Auth state management
│       ├── tasks.ts        # Firestore task operations
│       ├── recipes.ts      # Firestore recipe operations
│       ├── expenses.ts     # Firestore expense operations
│       ├── grocery.ts      # Firestore grocery operations
│       └── api.ts          # Vercel API calls
└── assets/                 # App icons and splash screen
```

## API Endpoints Used

All calls go to `https://jaiswals.live`:

| Endpoint | Feature |
|---|---|
| `POST /api/gemini/parse-recipe` | Import recipe from URL or text |
| `POST /api/gemini/parse-receipt` | Scan expense receipt |
| `POST /api/gemini/format-grocery` | Parse grocery list with AI |
| `POST /api/gemini/translate` | Translate content |

## Data Isolation

All Firestore queries filter by `userId`, ensuring each user only sees their own data. Same Firestore rules as the web app apply.
