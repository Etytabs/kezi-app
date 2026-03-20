# Kezi: Your Personal Health Companion

Kezi is a comprehensive, AI-powered mobile application designed to empower women by helping them understand and manage their menstrual cycle and overall health. This project was built with a focus on providing a personalized, culturally relevant, and secure experience for users in Rwanda and beyond.

## Key Features

-   **AI-Powered Cycle Tracking:** Accurate and personalized predictions for menstrual cycles, ovulation, and fertile windows.
-   **AI Health Companion:** An integrated chatbot that provides personalized insights, answers health questions, and offers support based on the user's cycle phase and logged symptoms.
-   **Integrated Marketplace:** A curated in-app marketplace for local vendors to sell health and wellness products, with recommendations tailored to the user's cycle.
-   **Secure and Private:** Features like biometric authentication, PIN lock, and a "Privacy Veil" to ensure user data is always protected.
-   **Multi-Lingual Support:** Full support for Kinyarwanda, French, and English.
-   **Holistic Health Tracking:** Log symptoms, moods, energy levels, and more to get a complete picture of your health.

## Tech Stack

### Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Language:** TypeScript
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Authentication:** JWT (JSON Web Tokens)

### Mobile App (Frontend)

-   **Framework:** React Native
-   **Platform:** Expo
-   **Language:** TypeScript
-   **UI:** Custom components with a "Gentle Glassmorphism" design.

### Database

-   **Production:** PostgreSQL
-   **Development:** PostgreSQL (via Docker)

## Project Structure

```
/
├── backend/            # Express.js API (The brain of the application)
│   ├── src/
│   │   ├── controllers/  # Handles incoming requests and business logic
│   │   ├── db/           # Database connection, schema, and ORM
│   │   ├── middleware/   # Express middleware (e.g., for authentication)
│   │   ├── routes/       # API route definitions
│   │   └── services/     # Business logic services (e.g., cycle prediction)
│   └── ...
├── mobile/             # React Native (Expo) application (The user interface)
│   ├── src/
│   │   ├── screens/      # Application screens
│   │   ├── components/   # Reusable UI components
│   │   ├── navigation/   # Navigation logic (React Navigation)
│   │   ├── services/     # API clients, auth services, etc.
│   │   ├── context/      # React context for state management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── design/       # Theme, colors, typography
│   │   └── i18n/         # Internationalization (translations)
│   └── ...
├── pitch-deck/         # Project pitch deck and assets
└── scripts/            # Shared utility scripts
```

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm
-   Docker (for running the local database)
-   Expo CLI

### 1. Clone the Repository

```bash
git clone https://github.com/Etytabs/kezi-app.git
cd kezi-app
```

### 2. Set Up the Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the local PostgreSQL database:**
    ```bash
    npm run db:start
    ```

4.  **Run the backend server:**
    ```bash
    npm run dev
    ```
    The server will be running on `http://localhost:3001`.

### 3. Set Up the Mobile App

1.  **Navigate to the mobile directory:**
    ```bash
    cd ../mobile
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Expo development server:**
    ```bash
    npm start
    ```

4.  **Run the app on a simulator or a physical device:**
    -   Scan the QR code with the Expo Go app on your iOS or Android device.
    -   Press `i` to run on an iOS simulator or `a` to run on an Android emulator.

## Live Demo

A live version of the web-based pitch deck and application QR codes can be accessed here:
[Kezi Pitch Deck](https://etytabs.github.io/kezi-app/pitch-deck/)
