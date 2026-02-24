# HomeMaid - Family AI Assistant

**From the Jaiswals family to all families around the world** 🏠

HomeMaid is a comprehensive family collaboration platform powered by AI, helping families organize their daily lives, plan together, and stay connected.

## 🌟 Features

- **Task Management** - Collaborate on family tasks and to-do lists
- **Recipe Discovery** - Find and share recipes with AI-powered recommendations
- **Grocery Lists** - Smart grocery list management and planning
- **Expense Tracking** - Track family expenses and manage budgets
- **Receipt Management** - Scan and organize receipts
- **Holiday Planning** - Plan family holidays and events together
- **AI Assistant** - Get personalized recommendations and assistance

## 🏗️ Project Structure

This is a monorepo containing:

- **`/www`** - Next.js web application with API services
- **`/app`** - React Native mobile application (Expo)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Firebase account
- Google AI API key
- Resend API key (for emails)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jaiswalashok/homemaid.git
cd homemaid
```

2. Install dependencies for the web app:
```bash
cd www
npm install
```

3. Install dependencies for the mobile app:
```bash
cd ../app
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys and configuration.

### Development

**Web Application:**
```bash
cd www
npm run dev
```

**Mobile Application:**
```bash
cd app
npm start
```

## 🌐 Deployment

### Vercel (Web)

The web application is deployed on Vercel at [homemaid.jaiswals.live](https://homemaid.jaiswals.live)

To deploy:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Mobile App

The React Native app can be built for iOS and Android:

```bash
cd app
npm run ios      # iOS
npm run android  # Android
```

## 🔐 Environment Variables

See `.env.example` for required environment variables including:

- Firebase configuration
- Google AI API key
- Resend email API key
- Database URLs
- Authentication secrets

## 📱 Technology Stack

### Web (Next.js)
- **Framework:** Next.js 16
- **UI:** React 19, TailwindCSS 4
- **AI:** Google Generative AI
- **Database:** Firebase Firestore
- **Email:** Resend
- **Hosting:** Vercel

### Mobile (React Native)
- **Framework:** Expo
- **Navigation:** React Navigation
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth, Expo Auth Session

## 📄 Legal

- [Privacy Policy](/www/src/app/privacy/page.tsx)
- [Terms of Use](/www/src/app/terms/page.tsx)

## 🤝 Support

For support, email us at [ashok@homemaid.jaiswals.live](mailto:ashok@homemaid.jaiswals.live)

## 📝 License

Copyright © 2024-2026 Jaiswals Family. All rights reserved.

---

**Built with ❤️ by the Jaiswals family for families everywhere**
