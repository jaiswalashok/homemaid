# HomeMaid API Documentation

**Base URL**: `https://annapurna-eight.vercel.app` (or your deployed URL)

All APIs use JSON for request/response bodies. Authentication is handled via Firebase Auth on the client side.

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Subscription & Billing APIs](#subscription--billing-apis)
3. [Usage & Limits API](#usage--limits-api)
4. [Gemini AI APIs](#gemini-ai-apis)
5. [Speech APIs](#speech-apis)
6. [Telegram Bot API](#telegram-bot-api)
7. [Firebase Integration](#firebase-integration)
8. [Subscription Tiers](#subscription-tiers)
9. [Mobile App Integration Guide](#mobile-app-integration-guide)

---

## Subscription Tiers

| Feature | Free ($0/mo) | Basic ($1/mo) | Premium ($2/mo) |
|---------|:---:|:---:|:---:|
| Family Members | 1 | 2 | 4 |
| Recipes | 10 | 20 | 40 |
| Grocery Items | 20 | 40 | 80 |
| Daily Tasks | 10 | 20 | 40 |
| AI Recipe Generation | ✅ | ✅ | ✅ |
| Telegram Bot | ✅ | ✅ | ✅ |

---

## Authentication APIs

### 1. Send Email Verification Code

**Endpoint**: `POST /api/auth/send-verification`

**Description**: Sends a 4-digit verification code to the user's email via Resend.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

**Error Response** (400/500):
```json
{
  "error": "Missing or invalid email"
}
```

---

### 2. Verify Email Code

**Endpoint**: `POST /api/auth/verify-code`

**Description**: Verifies the 4-digit code sent to the user's email. Code expires after 10 minutes.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "1234"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "verified": true
}
```

**Error Responses**:
- `400`: Invalid code
- `404`: No verification code found
- `410`: Code expired

---

### 3. Send Welcome Email

**Endpoint**: `POST /api/mobile/send-welcome`

**Description**: Sends a welcome email to a newly registered user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Welcome email sent successfully"
}
```

---

## Subscription & Billing APIs

### 4. Create Stripe Checkout Session

**Endpoint**: `POST /api/stripe/create-checkout`

**Description**: Creates a Stripe Checkout session for upgrading to a paid plan.

**Request Body**:
```json
{
  "tier": "basic",
  "userId": "firebase-uid-here",
  "email": "user@example.com",
  "returnUrl": "https://your-app.com"
}
```

**Response** (200 OK):
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Usage**: Redirect the user to the `url` to complete payment.

---

### 5. Stripe Webhook

**Endpoint**: `POST /api/stripe/webhook`

**Description**: Handles Stripe webhook events. Called by Stripe servers, not directly by clients.

**Events Handled**:
- `checkout.session.completed` — Activates subscription
- `customer.subscription.updated` — Updates tier
- `customer.subscription.deleted` — Downgrades to free
- `invoice.payment_failed` — Logs payment failure

---

### 6. Stripe Customer Portal

**Endpoint**: `POST /api/stripe/portal`

**Description**: Creates a Stripe Customer Portal session for managing billing.

**Request Body**:
```json
{
  "stripeCustomerId": "cus_...",
  "returnUrl": "https://your-app.com/settings"
}
```

**Response** (200 OK):
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

---

## Usage & Limits API

### 7. Get Usage Counts

**Endpoint**: `POST /api/usage`

**Description**: Returns the user's current usage counts and subscription tier. Use this to enforce limits before creating new items.

**Request Body**:
```json
{
  "userId": "firebase-uid-here"
}
```

**Response** (200 OK):
```json
{
  "tier": "free",
  "usage": {
    "recipes": 5,
    "groceryItems": 12,
    "tasks": 7,
    "familyMembers": 1
  }
}
```

**Usage Example** (Check before adding):
```javascript
const res = await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.uid })
});
const { tier, usage } = await res.json();

// Check limits (from subscription.ts TIER_LIMITS)
const limits = { free: { recipes: 10 }, basic: { recipes: 20 }, premium: { recipes: 40 } };
if (usage.recipes >= limits[tier].recipes) {
  alert('Recipe limit reached! Upgrade your plan.');
}
```

---

## Gemini AI APIs

### 1. Parse Recipe from Text

**Endpoint**: `POST /api/gemini/parse-recipe`

**Description**: Converts natural language recipe description into structured bilingual (English + Hindi) recipe data.

**Request Body**:
```json
{
  "text": "Butter chicken with naan",
  "language": "English"  // Optional, defaults to "English"
}
```

**Response** (200 OK):
```json
{
  "en": {
    "title": "Butter Chicken",
    "description": "Creamy tomato-based curry with tender chicken",
    "cuisine": "Indian",
    "prepTime": "20 mins",
    "cookTime": "30 mins",
    "servings": 4,
    "ingredients": [
      {
        "item": "Chicken breast",
        "quantity": "500",
        "unit": "grams"
      },
      {
        "item": "Butter",
        "quantity": "2",
        "unit": "tablespoons"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Marinate chicken in yogurt and spices",
        "duration": "15 mins"
      },
      {
        "stepNumber": 2,
        "instruction": "Cook chicken until golden brown",
        "duration": "10 mins"
      }
    ]
  },
  "hi": {
    "title": "बटर चिकन",
    "description": "मलाईदार टमाटर आधारित करी",
    "cuisine": "भारतीय",
    "prepTime": "20 मिनट",
    "cookTime": "30 मिनट",
    "servings": 4,
    "ingredients": [
      {
        "item": "चिकन ब्रेस्ट",
        "quantity": "500",
        "unit": "ग्राम"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "चिकन को दही और मसालों में मैरिनेट करें",
        "duration": "15 मिनट"
      }
    ]
  }
}
```

**Error Response** (400/500):
```json
{
  "error": "Missing or invalid 'text' parameter"
}
```

---

### 2. Generate Recipe Image

**Endpoint**: `POST /api/gemini/generate-image`

**Description**: Generates a photorealistic image of a dish using Gemini's image generation models.

**Request Body**:
```json
{
  "recipeName": "Butter Chicken"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64 encoded PNG
  "mimeType": "image/png"
}
```

**Usage Example** (Convert to Uint8Array):
```javascript
const binary = atob(imageBase64);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}
// Now upload bytes to Firebase Storage or display as image
```

**Error Response** (400/500):
```json
{
  "error": "Failed to generate image with all available models"
}
```

---

### 3. Translate Text

**Endpoint**: `POST /api/gemini/translate`

**Description**: Translates text to a target language using Gemini.

**Request Body**:
```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "Hindi"
}
```

**Response** (200 OK):
```json
{
  "translatedText": "नमस्ते, आप कैसे हैं?"
}
```

**Error Response** (400/500):
```json
{
  "error": "Missing or invalid 'text' parameter"
}
```

---

### 4. Generate Follow-Along Cooking Script

**Endpoint**: `POST /api/gemini/follow-along`

**Description**: Creates a conversational step-by-step cooking script for voice-guided cooking.

**Request Body**:
```json
{
  "recipe": {
    "title": "Butter Chicken",
    "description": "Creamy curry",
    "ingredients": [
      {
        "item": "Chicken",
        "quantity": "500",
        "unit": "grams"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Marinate chicken",
        "duration": "15 mins"
      }
    ]
  },
  "language": "English"  // Optional, defaults to "English"
}
```

**Response** (200 OK):
```json
{
  "script": [
    "Welcome! Let's cook Butter Chicken together.",
    "First, gather your ingredients: 500 grams of chicken...",
    "Step 1: Marinate the chicken in yogurt and spices. This will take about 15 minutes.",
    "Step 2: Heat oil in a pan...",
    "Your Butter Chicken is ready! Enjoy your meal!"
  ]
}
```

**Error Response** (400/500):
```json
{
  "error": "Missing or invalid 'recipe' parameter"
}
```

---

## Speech APIs

### 5. Speech-to-Text (Transcription)

**Endpoint**: `POST /api/speech/transcribe`

**Description**: Transcribes audio to text using Gemini AI. Supports multiple audio formats.

**Request**: `multipart/form-data`

**Form Fields**:
- `audio` (File): Audio file (webm, mp3, wav, etc.)
- `language` (string): Target language for transcription (e.g., "English", "Hindi")

**Example using FormData**:
```javascript
const formData = new FormData();
formData.append("audio", audioBlob, "recording.webm");
formData.append("language", "English");

const response = await fetch('/api/speech/transcribe', {
  method: 'POST',
  body: formData
});
```

**Response** (200 OK):
```json
{
  "transcription": "This is the transcribed text from the audio"
}
```

**Error Response** (400/500):
```json
{
  "error": "Missing audio file"
}
```

---

### 6. Text-to-Speech (Synthesis)

**Endpoint**: `POST /api/speech/synthesize`

**Description**: Converts text to natural-sounding speech using Google Cloud Text-to-Speech API.

**Request Body**:
```json
{
  "text": "Hello, welcome to Annapurna!",
  "language": "English"  // Optional, defaults to "English"
}
```

**Response** (200 OK):
```json
{
  "audioBase64": "//uQxAA...",  // Base64 encoded MP3 audio
  "mimeType": "audio/mp3"
}
```

**Usage Example** (Play audio in browser):
```javascript
const response = await fetch('/api/speech/synthesize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello!', language: 'English' })
});

const data = await response.json();

// Convert base64 to audio and play
const audioData = atob(data.audioBase64);
const arrayBuffer = new ArrayBuffer(audioData.length);
const view = new Uint8Array(arrayBuffer);
for (let i = 0; i < audioData.length; i++) {
  view[i] = audioData.charCodeAt(i);
}

const audioContext = new AudioContext();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(audioContext.destination);
source.start(0);
```

**Error Response** (400/500):
```json
{
  "error": "Missing or invalid 'text' parameter"
}
```

---

## Telegram Bot API

**Endpoint**: `POST /api/telegram`

**Description**: Webhook endpoint for Telegram bot. Handles text messages, voice messages, photos (receipt scanning), and callback queries.

**Note**: This endpoint is called by Telegram servers, not directly by clients. For mobile app integration, use the Gemini APIs above instead.

---

## Firebase Integration

### Authentication
All client-side operations require Firebase Authentication. Use the following credentials:

```javascript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // ... other config
};
```

### Firestore Collections

1. **users** (NEW — SaaS user profiles)
   - Fields: `uid`, `email`, `displayName`, `photoURL`, `emailVerified`, `tier` (free/basic/premium), `stripeCustomerId`, `stripeSubscriptionId`, `familyMembers[]`, `createdAt`, `updatedAt`

2. **emailVerifications** (NEW — email verification codes)
   - Fields: `email`, `code`, `expiresAt`, `verified`

3. **recipes**
   - Fields: `en`, `hi`, `images[]`, `videos{en, hi}`, `userId`, `createdAt`, `updatedAt`
   
4. **tasks**
   - Fields: `title`, `status`, `isUrgent`, `isDaily`, `date`, `order`, `elapsedMs`, `source`, `createdAt`, `startedAt`, `pausedAt`, `completedAt`, `userId`
   
5. **dailyTaskTemplates**
   - Fields: `title`, `order`, `enabled`, `recurrence`, `dayOfWeek`, `dayOfMonth`, `isRecipe`, `recipeId`
   
6. **expenses**
   - Fields: `vendor`, `amount`, `type`, `date`, `items[]`, `paymentMethod`, `userId`, `createdAt`
   
7. **groceries**
   - Fields: `item`, `quantity`, `unit`, `purchased`, `userId`, `createdAt`

### Firebase Storage

**Path**: `recipes/{timestamp}_{recipeName}.png`

Upload images using Firebase Storage SDK after receiving base64 from image generation API.

---

## Client Helper Library

For easier integration, use the provided client-side helper library:

### Speech Recognition (Speech-to-Text)

```javascript
import { SpeechRecognition } from '@/lib/speech-api';

const recognition = new SpeechRecognition('English'); // or 'Hindi'

recognition.onresult = (result) => {
  console.log('Transcription:', result.transcript);
  // Use the transcribed text
};

recognition.onerror = (error) => {
  console.error('Recognition error:', error);
};

recognition.onend = () => {
  console.log('Recognition ended');
};

// Start recording and transcribing
await recognition.start();

// Stop recording (will automatically transcribe)
recognition.stop();
```

### Speech Synthesis (Text-to-Speech)

```javascript
import { SpeechSynthesis } from '@/lib/speech-api';

const synthesis = new SpeechSynthesis();

// Speak text (returns a promise that resolves when audio finishes)
await synthesis.speak('Hello, welcome to Annapurna!', 'English');

// Cancel current speech
synthesis.cancel();
```

---

## Mobile App Integration Guide

### 1. Add Recipe Flow

```javascript
// Step 1: Parse recipe from user input
const parseResponse = await fetch('https://annapurna-eight.vercel.app/api/gemini/parse-recipe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: userInput,
    language: 'English'
  })
});
const recipe = await parseResponse.json();

// Step 2: Generate image
const imageResponse = await fetch('https://annapurna-eight.vercel.app/api/gemini/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: recipe.en.title
  })
});
const imageData = await imageResponse.json();

// Step 3: Convert base64 to bytes and upload to Firebase Storage
const binary = atob(imageData.imageBase64);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}

const storageRef = ref(storage, `recipes/${Date.now()}_${recipe.en.title}.png`);
const uploadResult = await uploadBytes(storageRef, bytes);
const imageUrl = await getDownloadURL(uploadResult.ref);

// Step 4: Save to Firestore
await addDoc(collection(db, 'recipes'), {
  en: recipe.en,
  hi: recipe.hi,
  images: [imageUrl],
  userId: currentUser.uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

### 2. Follow-Along Cooking Mode

```javascript
// Get recipe from Firestore
const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
const recipe = recipeDoc.data();

// Generate cooking script
const scriptResponse = await fetch('https://annapurna-eight.vercel.app/api/gemini/follow-along', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipe: recipe.en,  // or recipe.hi for Hindi
    language: 'English'
  })
});
const { script } = await scriptResponse.json();

// Use text-to-speech to read each step
script.forEach((step, index) => {
  // Play audio for each step
  textToSpeech.speak(step);
});
```

### 3. Task Management

```javascript
// Add a task
await addDoc(collection(db, 'tasks'), {
  title: 'Buy groceries',
  status: 'pending',
  isUrgent: false,
  isDaily: false,
  date: '2026-02-23',
  order: 0,
  elapsedMs: 0,
  userId: currentUser.uid,
  createdAt: serverTimestamp()
});

// Listen to tasks in real-time
const q = query(
  collection(db, 'tasks'),
  where('userId', '==', currentUser.uid),
  where('date', '==', todayString)
);

onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  // Update UI with tasks
});
```

---

## Rate Limiting & Error Handling

- Gemini APIs have rate limits. The server implements automatic retry with exponential backoff (3 retries, 2s base delay).
- Always handle errors gracefully and provide fallback options.
- For image generation failures, use fallback placeholder images.

---

## Environment Variables Required

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=...

# Firebase Admin Auth (server-side Firestore writes)
NEXT_PUBLIC_FIREBASE_AUTH_EMAIL=...
NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD=...

# Telegram Bot
TELEGRAM_BOT_TOKEN=...

# Resend (email verification & welcome emails)
RESEND_API_KEY=...

# Stripe (subscription billing)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_BASIC_PRICE_ID=...
STRIPE_PREMIUM_PRICE_ID=...
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=...
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Stripe Setup Guide

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products in the Stripe Dashboard:
   - **Basic Plan**: $1/month recurring
   - **Premium Plan**: $2/month recurring
3. Copy the Price IDs into your `.env.local`
4. Set up a webhook endpoint pointing to `/api/stripe/webhook`
5. Enable the following webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

---

## Mobile App Auth Flow

### Sign Up with Email Verification

```javascript
// Step 1: Send verification code
const sendRes = await fetch('BASE_URL/api/auth/send-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Step 2: User enters the 4-digit code from their email
const verifyRes = await fetch('BASE_URL/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', code: '1234' })
});
const { verified } = await verifyRes.json();

// Step 3: Create Firebase Auth account (use Firebase SDK)
if (verified) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  
  // Step 4: Send welcome email
  await fetch('BASE_URL/api/mobile/send-welcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  });
}
```

### Upgrade Subscription (Mobile)

```javascript
// Step 1: Check current usage
const usageRes = await fetch('BASE_URL/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.uid })
});
const { tier, usage } = await usageRes.json();

// Step 2: Create checkout session
const checkoutRes = await fetch('BASE_URL/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'basic', // or 'premium'
    userId: currentUser.uid,
    email: currentUser.email,
    returnUrl: 'your-app-deep-link://'
  })
});
const { url } = await checkoutRes.json();

// Step 3: Open Stripe Checkout in browser/webview
openURL(url);
```

### Manage Billing (Mobile)

```javascript
// Open Stripe Customer Portal
const portalRes = await fetch('BASE_URL/api/stripe/portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stripeCustomerId: userProfile.stripeCustomerId,
    returnUrl: 'your-app-deep-link://'
  })
});
const { url } = await portalRes.json();
openURL(url);
```

---

## App Pages & Routes

| Route | Description | Auth Required |
|-------|-------------|:---:|
| `/landing` | Landing page with hero, features, pricing | No |
| `/login` | Login/signup with email, Google, Apple | No |
| `/` | Tasks (daily task management) | Yes |
| `/recipes` | Recipe management | Yes |
| `/grocery` | Grocery list | Yes |
| `/expenses` | Expense tracking | Yes |
| `/settings` | Profile, subscription, billing | Yes |

---

## Support & Contact

For issues or questions, contact the development team or check the repository documentation.
