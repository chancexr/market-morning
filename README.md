# Market Morning

A simple weekday wake-up alarm with U.S. market-session reminders. The first release is deliberately local-first: no account and no price-data subscription.

## Run it

1. Install Node.js 20+ and Expo tooling, then run `npm install`.
2. Run `npx expo start`.
3. Scan the QR code with Expo Go, or run an iOS simulator from macOS.

For VS Code, install the recommended **Expo Tools** extension when prompted. Open the integrated terminal with `Ctrl` + `` ` `` to run the commands above.

If a newly installed Node.js terminal has not been restarted yet, use **Terminal → Run Task → Start Market Morning** in VS Code. This task uses the workspace's bundled Node runtime.

## Current scope

- Weekday wake-up notification
- Pre-market, market open, and market close reminders
- On-device scheduling (up to 60 pending notifications) expressed in U.S. Eastern Time
- Weekend and major NYSE-holiday exclusion
- Stock-scanner screen with price, percent-move, and volume filters
- Persistent alarm-sound settings, instant previews, and an optional notification test

Notifications need to be refreshed by opening the app periodically; the number of days scheduled adjusts to stay within iPhone notification limits. Before App Store submission, test all notification behavior on a physical iPhone.

## Code layout

- `App.tsx` — the screen and user interactions
- `theme.ts` — global colors and spacing; start here for visual changes
- `styles.ts` — reusable screen styles
- `notificationService.ts` — notification permission and scheduling logic
- `marketCalendar.ts` and `marketStatus.ts` — market dates, holidays, and open/closed status
- `time.ts` and `types.ts` — shared helpers and TypeScript types
- `ScannerScreen.tsx` and `stockService.ts` — scanner UI and optional Alpha Vantage market data
- `SettingsScreen.tsx` and `alarmSettings.ts` — sound selection and persistent alarm preferences

## Optional market data

The scanner runs with clearly labeled demo data by default. To use Alpha Vantage's end-of-day top movers, copy `.env.example` to `.env`, add your API key, and restart Expo. Never commit `.env`.
