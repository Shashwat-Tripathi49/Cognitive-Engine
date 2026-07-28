# 📱 Mobile Application

> Cognitive Engine's mobile application for iOS and Android.

---

## Technology

| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform native UI |
| **Expo** (SDK 52+) | Development tooling, OTA updates |
| **TypeScript** | Type safety |
| **Expo Router** | File-based navigation |

## Status

🔮 **Future — Phase 3.** The mobile app is planned but not yet in development.

## Design Considerations

- **Shared code**: Maximum code reuse via `packages/shared` and `packages/ui`
- **Offline-first**: Entries can be captured without network connectivity
- **Push notifications**: Daily cognitive digest delivery
- **Native feel**: Platform-specific UI patterns where appropriate
- **Quick capture**: Widget / share sheet integration for frictionless input

## Planned Structure

```
apps/mobile/
├── app/                → Expo Router pages
├── components/         → Mobile-specific components
├── hooks/              → Mobile-specific hooks
├── lib/                → API client, local storage
├── assets/             → Icons, splash screen
├── app.json            → Expo config
├── tsconfig.json
└── package.json
```

---

> _Mobile development will begin after web MVP is validated in Phase 3._
