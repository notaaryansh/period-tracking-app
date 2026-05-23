# Bloom — Period Tracking App

A personal, local-first period tracker built with Expo + SQLite. Tracks cycles, predicts upcoming phases, logs moods, captures notes, and uses OpenAI to surface gentle suggestions on how to support her through each phase.

- Local SQLite storage (no server, no auth)
- Cycle phase math (menstrual / follicular / ovulation / luteal)
- Skia-powered cycle wheel with glowing phase indicator
- Calendar grid with phase-colored days
- Mood logging with phase-aware choices
- Notes with tags
- Proactive local notifications (period soon, ovulation day, mood check-ins, phase transitions)
- AI suggestions via `gpt-5-mini`

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-...
```

## Run (development)

```bash
npx expo start
```

Then either:
- iOS — scan the QR code with the **Camera** app on your iPhone (opens Expo Go).
- Android — scan the QR code from inside the **Expo Go** app (Play Store).
- Simulator/emulator — press `i` for iOS, `a` for Android in the terminal.

> Note: this app uses `@shopify/react-native-skia` and `expo-notifications`, which are bundled with Expo SDK 56 — Expo Go should work. If you hit a missing-native-module error, build a development client (next section).

## Development build (custom dev client)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
# or: eas build --profile development --platform ios
```

Install the resulting build on your device, then run `npx expo start --dev-client` and scan the QR.

## Standalone install on your phone (no Expo Go)

### Android — easiest, free

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

This produces an **APK** download link. Transfer the APK to your phone, allow "install from unknown sources", install. Done.

### iOS — requires Apple Developer Program ($99/yr)

Apple doesn't let you sideload arbitrary apps. Options:

1. **Apple Developer Program ($99/yr)** + `eas build --profile preview --platform ios` → install via ad-hoc provisioning on your registered device.
2. **TestFlight** (same $99/yr) — same build, easier install flow.
3. **AltStore / Sideloadly** (free) — sideload via your free Apple ID; expires every 7 days.

For an iPhone-only personal app the cleanest path is option 1.

## Project structure

```
src/
  app/
    _layout.tsx              # root stack + init (DB, notifications)
    (tabs)/
      _layout.tsx            # tab bar
      index.tsx              # Today — cycle wheel + suggestions
      calendar.tsx           # month grid
      mood.tsx               # mood logger
      notes.tsx              # notes CRUD
      settings.tsx           # cycle settings + data wipe
  components/
    wheel/CycleWheel.tsx     # Skia circular phase wheel
    calendar/CalendarGrid.tsx
    cards/Card.tsx
  lib/
    db.ts                    # SQLite schema + queries
    cycle.ts                 # phase math + mood choices
    openai.ts                # gpt-5-mini suggestions
    notifications.ts         # local notification scheduling
  theme/
    colors.ts                # sakura palette + per-phase colors
```

## Notes

- All data lives in `bloom.db` on the device. Uninstalling the app erases everything.
- The OpenAI key is bundled into the app at build time. Don't share the build outside your own devices.
