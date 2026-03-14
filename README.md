# Kezi - Cycle Tracking & Wellness App

Your trusted companion for cycle tracking, maternal health, and wellness. Track your menstrual cycle with precision, access personalized AI health insights, shop cycle-synced wellness products, and connect with nearby pharmacies — all in one beautifully designed app built for women in Rwanda and beyond.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Design System](#design-system)
- [Multi-Role System](#multi-role-system)
- [Security & Privacy](#security--privacy)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Kezi is a comprehensive women's health platform built with Expo React Native and backed by an Express.js API server with PostgreSQL. It provides an all-in-one solution for menstrual cycle tracking, wellness journaling, AI-powered health insights, a curated marketplace for health products, and maternal health support — all wrapped in a "Gentle Glassmorphism" design system optimized for emotional safety and privacy.

**Bundle ID:** `app.kezi.health`
**Current Version:** 1.0.0
**Category:** Health & Fitness
**Supported Platforms:** iOS, Android, Web

---

## Key Features

### Cycle Tracking
- Deterministic phase calculation (Menstrual, Follicular, Ovulation, Luteal)
- Interactive SVG cycle wheel with animated progress
- Calendar view with phase indicators and logged days
- Fertility window detection and ovulation markers
- Configurable cycle and period length

### Wellness Journal
- Daily mood tracking with visual indicators
- Symptom logging with categorized selections
- Free-form notes with historical entries
- Phase-correlated insights

### AI Chat Assistant
- Personalized health insights powered by OpenAI GPT-4o-mini
- Cycle-aware responses based on current phase, day, and fertility status
- Memory persistence for contextual conversations
- Suggested questions based on current cycle phase
- Secure backend proxy pattern (API key never exposed to client)

### Marketplace
- Cycle-synced product filtering and recommendations
- Stock level indicators (In Stock, Low Stock, Out of Stock)
- Cart functionality with quantity management
- Multi-step checkout: Address, Payment, Confirmation
- Payment methods: Cash on Delivery, Mobile Money, Card
- Geospatial merchant discovery with distance-based sorting
- First-time user onboarding tutorial
- Wishlist support

### Maternal Health
- Pregnancy tracker with milestone tracking
- Postpartum care guidance and resources
- Prescription scanning capability

### Health Integration
- Manual entry for sleep, steps, heart rate, weight, body temperature, and more
- Health dashboard with metric visualizations
- Platform connection management (Apple Health / Google Fit UI-ready)
- Anonymous mode with local-only storage

### Admin Dashboard
- Multi-panel analytics: User Growth, Active Cycles, Inventory Health
- Merchant management with approval controls
- User role management and status controls
- Inventory alerts and AI Insights log
- System health monitoring and audit trails

### Merchant Portal
- Product inventory management
- Order tracking and fulfillment
- Store location management with geospatial data
- Merchant profile and settings

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Expo SDK 54 | React Native framework |
| React Navigation 7 | Navigation (tabs, stacks) |
| React Native Reanimated | Animations and gestures |
| React Native SVG | Cycle wheel and graphics |
| Expo Blur / Glass Effect | Glassmorphism UI effects |
| Expo Linear Gradient | Gradient backgrounds |
| AsyncStorage | Local data persistence |
| Expo Secure Store | Sensitive data storage |
| Expo Location | Geospatial merchant discovery |
| Expo Local Authentication | Biometric auth (Face ID / Touch ID) |
| Expo Notifications | Push notifications |
| Expo Localization | i18n support |

### Backend
| Technology | Purpose |
|---|---|
| Express.js | REST API server |
| PostgreSQL (Neon) | Primary database |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| OpenAI API | AI Chat (GPT-4o-mini) |
| Resend | Transactional emails |

---

## Project Structure

```
kezi/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── App.tsx
│   ├── app.json
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── context/
│   ├── hooks/
│   ├── i18n/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── utils/
├── pitch-deck/
├── scripts/
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app (for testing on physical devices)
- PostgreSQL database (provided by Replit)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd kezi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) below)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Test on your device:**
   - Scan the QR code with Expo Go (Android) or the Camera app (iOS)
   - Or open `http://localhost:8081` in your browser for the web version

---

## Environment Variables

### Required Secrets (stored in Replit Secrets)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATA_ENCRYPTION_KEY` | 256-bit hex key for data encryption |
| `OPENAI_API_KEY` | OpenAI API key for AI Chat |

### Environment Variables
| Variable | Default | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://Kezirw.replit.app/api` | Backend API URL |
| `API_PORT` | `3001` | Express server port |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify` | Email verification |
| GET | `/api/auth/me` | Get current user |

### Cycle Tracking
| Method | Endpoint | Description |
|---|---|
| GET | `/api/cycle` | Get cycle data |
| POST | `/api/cycle` | Log cycle data |

### Journal
| Method | Endpoint | Description |
|---|---|
| GET | `/api/journal` | Get journal entries |
| POST | `/api/journal` | Create journal entry |
| DELETE | `/api/journal/:id` | Delete entry |

### Health Records
| Method | Endpoint | Description |
|---|---|
| GET | `/api/health/records` | List health records |
| POST | `/api/health/records` | Batch create records |
| DELETE | `/api/health/records` | Delete records |
| GET | `/api/health/summary` | Aggregated health stats |
| GET | `/api/health/connections` | List health connections |
| POST | `/api/health/connections` | Upsert connection |
| DELETE | `/api/health/connections` | Remove connection |

### Products & Marketplace
| Method | Endpoint | Description |
|---|---|
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Product details |
| GET | `/api/merchants` | List merchants |
| GET | `/api/stores` | List stores |

### Orders
| Method | Endpoint | Description |
|---|---|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List user orders |

### AI Chat
| Method | Endpoint | Description |
|---|---|
| POST | `/api/chat` | Send message to AI assistant |

### Admin
| Method | Endpoint | Description |
|---|---|
| GET | `/api/admin/analytics` | Dashboard analytics |
| GET | `/api/admin/users` | Manage users |
| GET | `/api/admin/merchants` | Manage merchants |

---

## Design System

Kezi uses a **"Gentle Glassmorphism"** design language optimized for emotional safety in women's health tracking.

### Color Palette
- **Brand Gradient:** Pink to Purple
- **Menstrual Phase:** Pink / Rose
- **Follicular Phase:** Teal / Emerald
- **Ovulation Phase:** Purple / Indigo
- **Luteal Phase:** Pink-Purple blend
- **Dark Theme Base:** Deep Lavender (`#1A1025`)

### UI Principles
- Frosted glass effects with subtle blur
- Squircle shapes (16-24px rounded corners)
- Dynamic cycle-synced gradient backgrounds
- Inter font family throughout
- Smooth spring animations via Reanimated
- Responsive layouts: 1-4 column grids adapting to screen size

---

## Multi-Role System

Kezi supports three user roles with role-based navigation and permissions:

| Role | Access |
|---|---|
| **User** | Cycle tracking, journal, shop, maternal health, AI chat, health dashboard |
| **Merchant** | Product management, order fulfillment, store management, merchant dashboard |
| **Admin** | User management, merchant approvals, analytics, system settings, audit trails |

---

## Security & Privacy

- **Authentication:** JWT-based with email verification
- **Biometric Auth:** Face ID / Touch ID with PIN fallback
- **Data Encryption:** AES-256 encryption for sensitive health data
- **Discreet Mode:** Hides sensitive information from the screen
- **Privacy Veil:** Overlay component for quick screen hiding
- **Secrets Management:** All credentials stored in Replit Secrets (never hardcoded)
- **API Proxy:** OpenAI API key secured server-side, never exposed to client

---

## Internationalization

Kezi supports three languages with pre-authentication language selection:

| Code | Language |
|---|---|
| `en` | English |
| `fr` | French |
| `rw` | Kinyarwanda |

Currency is centralized to **RWF** (Rwandan Franc) formatting throughout the app.

---

## Deployment

### Development
- Express server runs on port **3001**
- Expo dev server runs on port **8081**
- API URL defaults to `http://localhost:3001/api`

### Production (Replit)
When published through Replit:
1. The Express server serves both API endpoints and static Expo build files
2. API URL auto-detects the production domain
3. Database uses the same PostgreSQL instance
4. All secrets are preserved
5. The app is accessible at `https://Kezirw.replit.app`

### Mobile App Distribution
For app store submission, see the [Publishing to App Stores](#publishing-to-app-stores) section in the project documentation.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Code Conventions
- Follow the existing "Gentle Glassmorphism" design system
- Use `ThemedText` and `ThemedView` for theme-aware components
- Use `GlassCard` for elevated containers
- Follow the established navigation patterns (stack within tabs)
- Use `formatRWF()` for all currency display
- Keep sensitive data in Replit Secrets, never hardcode credentials

---

## License

This project is proprietary. All rights reserved.
## Environment Setup

Copy the example environment file:
## Environment Setup

Copy the example environment file:
cp .env.example .env

Then fill in the required environment variables.
## Project Setup

Clone the repository:


git clone https://github.com/Etytabs/kezi-app.git

cd kezi-app


Run the setup script:


npm run setup


Start backend:


cd backend
npm run dev


Start mobile:


cd mobile
npm start