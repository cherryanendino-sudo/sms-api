# SMS Gateway - React Native

A custom Android application that transforms a dual-SIM Android smartphone into a programmable SMS Gateway. It receives HTTP requests from a backend server and dispatches them as SMS messages over the carrier network.

## Architecture

The app uses a **dual-layer architecture**:

- **Kotlin native layer** handles all critical operations: embedded HTTP server (NanoHTTPD), SMS dispatch (SmsManager), SIM management (SubscriptionManager), message queue (Room DB), delivery reports, and webhook delivery. This runs inside an Android Foreground Service.

- **React Native layer** provides a dashboard UI for monitoring and configuration. It communicates with the native layer through bridge modules.

## Features

- **REST API** - Embedded HTTP server with `POST /send`, `GET /status`, `GET /messages/:id`
- **Dual-SIM rotation** - Auto-rotates between SIM 1 and SIM 2 to distribute load
- **Anti-spam throttling** - Configurable delay between messages (15-120 seconds)
- **Daily limits** - Per-SIM daily message caps with automatic pause
- **Local queue** - SQLite persistence with automatic retry on failure
- **Exponential backoff** - 1min, 5min, 15min, 30min, 60min retry intervals (up to 20 attempts)
- **Delivery webhooks** - HTTP POST to backend on SMS delivery confirmation
- **Bearer token auth** - API key validation on all incoming requests
- **Foreground service** - Persistent notification with WAKE_LOCK for background processing
- **Auto-start on boot** - Optionally restart the service after device reboot

## Prerequisites

- Node.js 18+
- JDK 17
- Android SDK 34 (target), min SDK 26 (Android 8.0)
- Physical Android device with dual SIM (emulators cannot send real SMS)

## Setup

```bash
# Install JS dependencies
cd SmsGateway
npm install

# Run on connected device
npx react-native run-android
```

## Device Configuration (ADB)

Run these commands once on the device to increase OS-level SMS rate limits:

```bash
# Increase SMS rate limit to 2000 per day
adb shell settings put global sms_outgoing_check_max_count 2000
adb shell settings put global sms_outgoing_check_interval_ms 86400000

# Whitelist the app from battery optimization
adb shell dumpsys deviceidle whitelist +com.smsgateway
```

## API Usage

### Send a message

```bash
curl -X POST http://<device-ip>:8080/send \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+639171234567",
    "messageText": "Your OTP is 123456",
    "simSlot": 1
  }'
```

**Response (202 Accepted):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "QUEUED",
  "createdAt": "2026-03-26T09:00:00.000Z"
}
```

### Check server status

```bash
curl http://<device-ip>:8080/status \
  -H "Authorization: Bearer <api-key>"
```

### Get message status

```bash
curl http://<device-ip>:8080/messages/<message-id> \
  -H "Authorization: Bearer <api-key>"
```

## Project Structure

```
SmsGateway/
├── src/                          # React Native (TypeScript)
│   ├── App.tsx                   # Root component
│   ├── navigation/               # Tab navigator
│   ├── screens/                  # Dashboard, Queue, Settings, Logs
│   ├── components/               # Reusable UI components
│   ├── store/                    # Zustand state management
│   ├── native/                   # TypeScript bridge interfaces
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Helpers and formatters
│
├── android/app/src/main/java/com/smsgateway/
│   ├── server/                   # NanoHTTPD HTTP server + auth
│   ├── sms/                      # SMS dispatch + SIM management
│   ├── queue/                    # Message queue processor + retry
│   ├── db/                       # Room database (SQLite)
│   ├── service/                  # Foreground service + boot receiver
│   ├── webhook/                  # Delivery webhook client
│   ├── SmsGatewayPackage.kt      # RN native module registration
│   ├── MainApplication.kt       # Application entry point
│   └── MainActivity.kt          # Main activity
│
└── android/app/src/main/AndroidManifest.xml
```

## Building for Release

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

## License

Private - All rights reserved.
