# SMS Gateway - React Native Implementation Plan

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Phases](#4-implementation-phases)
5. [Native Module Design](#5-native-module-design)
6. [Database Schema](#6-database-schema)
7. [API Specification](#7-api-specification)
8. [State Management](#8-state-management)
9. [UI Screens](#9-ui-screens)
10. [Testing Strategy](#10-testing-strategy)
11. [Build & Deployment](#11-build--deployment)
12. [Risks & Mitigations](#12-risks--mitigations)

---

## 1. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Framework** | React Native 0.76+ (New Architecture) | Cross-platform foundation with native bridge access |
| **Language (JS)** | TypeScript | Type safety, better DX, fewer runtime errors |
| **Language (Native)** | Kotlin | Modern Android-native code for SMS/SIM/Service modules |
| **HTTP Server** | NanoHTTPD (embedded in Kotlin) | Lightweight, battle-tested Java/Kotlin HTTP server that runs inside the Android process |
| **Database** | Room (SQLite via Kotlin) + exposed to JS via native module | Reliable local persistence with compile-time query validation |
| **State Management** | Zustand | Lightweight, minimal boilerplate, works well with async native events |
| **Navigation** | React Navigation 7 | Standard RN navigation library |
| **Networking (outbound)** | Axios | For webhook delivery to backend |
| **Background Service** | Android Foreground Service (Kotlin) | Required by Android OS to keep the app alive |
| **Build Tool** | Gradle (Kotlin DSL) | Standard Android build system |
| **Testing** | Jest + React Native Testing Library + JUnit (native) | JS and native test coverage |

### Why React Native instead of pure native?

The app is heavily Android-specific, but React Native provides:
- Faster UI iteration for the dashboard/settings screens
- Familiar JS/TS stack for teams that maintain the backend
- The heavy lifting (SMS, SIM, HTTP server, foreground service) lives entirely in Kotlin native modules, so there is no performance penalty on the critical path

> **Important caveat:** All SMS dispatch, SIM management, queue processing, and the embedded HTTP server run as **Kotlin native modules** bridged to React Native. The JS layer handles only the UI and configuration. This is not a typical "React Native app" -- it is a native Android service with a React Native dashboard.

---

## 2. Project Structure

```
sms-gateway/
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/smsgateway/
│   │   │   │   ├── MainApplication.kt
│   │   │   │   ├── MainActivity.kt
│   │   │   │   │
│   │   │   │   ├── server/                  # Embedded HTTP server
│   │   │   │   │   ├── SmsHttpServer.kt     # NanoHTTPD server implementation
│   │   │   │   │   ├── AuthMiddleware.kt    # Bearer token validation
│   │   │   │   │   └── ServerModule.kt      # RN native module bridge
│   │   │   │   │
│   │   │   │   ├── sms/                     # SMS dispatch engine
│   │   │   │   │   ├── SmsDispatcher.kt     # SmsManager wrapper
│   │   │   │   │   ├── SimManager.kt        # Dual-SIM detection & rotation
│   │   │   │   │   ├── DeliveryReceiver.kt  # BroadcastReceiver for delivery reports
│   │   │   │   │   └── SmsModule.kt         # RN native module bridge
│   │   │   │   │
│   │   │   │   ├── queue/                   # Message queue processor
│   │   │   │   │   ├── MessageQueue.kt      # Queue orchestrator with throttling
│   │   │   │   │   ├── RetryPolicy.kt       # Exponential backoff logic
│   │   │   │   │   └── QueueModule.kt       # RN native module bridge
│   │   │   │   │
│   │   │   │   ├── db/                      # Room database
│   │   │   │   │   ├── AppDatabase.kt       # Room database definition
│   │   │   │   │   ├── MessageDao.kt        # Data access object
│   │   │   │   │   ├── MessageEntity.kt     # Table entity
│   │   │   │   │   └── DatabaseModule.kt    # RN native module bridge
│   │   │   │   │
│   │   │   │   ├── service/                 # Foreground service
│   │   │   │   │   ├── GatewayForegroundService.kt
│   │   │   │   │   ├── WakeLockManager.kt
│   │   │   │   │   └── ServiceModule.kt     # RN native module bridge
│   │   │   │   │
│   │   │   │   └── webhook/                 # Outbound webhook delivery
│   │   │   │       ├── WebhookClient.kt     # OkHttp-based POST to backend
│   │   │   │       └── WebhookModule.kt     # RN native module bridge
│   │   │   │
│   │   │   ├── res/
│   │   │   │   └── ... (icons, notification channels, etc.)
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
│
├── src/
│   ├── App.tsx                              # Root component
│   ├── navigation/
│   │   └── AppNavigator.tsx                 # Tab/stack navigator
│   │
│   ├── screens/
│   │   ├── DashboardScreen.tsx              # Live stats, server status
│   │   ├── QueueScreen.tsx                  # Message queue viewer
│   │   ├── SettingsScreen.tsx               # Configuration panel
│   │   └── LogsScreen.tsx                   # Activity log viewer
│   │
│   ├── components/
│   │   ├── StatusCard.tsx                   # Server/SIM status cards
│   │   ├── MessageItem.tsx                  # Queue item row
│   │   ├── SimSelector.tsx                  # SIM toggle control
│   │   └── ThrottleSlider.tsx               # Delay configuration slider
│   │
│   ├── store/
│   │   ├── useServerStore.ts                # Server state (running, port, IP)
│   │   ├── useQueueStore.ts                 # Queue stats
│   │   └── useSettingsStore.ts              # User configuration
│   │
│   ├── native/
│   │   ├── ServerBridge.ts                  # TS bindings for ServerModule
│   │   ├── SmsBridge.ts                     # TS bindings for SmsModule
│   │   ├── QueueBridge.ts                   # TS bindings for QueueModule
│   │   ├── DatabaseBridge.ts                # TS bindings for DatabaseModule
│   │   ├── ServiceBridge.ts                 # TS bindings for ServiceModule
│   │   └── WebhookBridge.ts                 # TS bindings for WebhookModule
│   │
│   ├── types/
│   │   ├── message.ts                       # Message types/interfaces
│   │   ├── settings.ts                      # Settings types
│   │   └── api.ts                           # API request/response types
│   │
│   └── utils/
│       ├── permissions.ts                   # Runtime permission helpers
│       └── formatters.ts                    # Date/number formatting
│
├── __tests__/
│   ├── screens/
│   ├── components/
│   └── store/
│
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
└── README.md
```

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                        │
│              (on same LAN / Wi-Fi)                       │
│                                                         │
│  Sends POST /send ──────────┐   Receives webhooks ◄──┐ │
└─────────────────────────────┼─────────────────────────┼─┘
                              │                         │
                              ▼                         │
┌─────────────────────────────────────────────────────────┐
│              ANDROID DEVICE (React Native App)          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Foreground Service (always-on)             │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │ NanoHTTPD   │  │  Message   │  │  SMS       │  │  │
│  │  │ HTTP Server │─▶│  Queue     │─▶│  Dispatcher│  │  │
│  │  │ (port 8080) │  │  (Room DB) │  │  (SmsManager) │  │
│  │  └─────────────┘  └────────────┘  └─────┬─────┘  │  │
│  │        │                                 │        │  │
│  │   Auth Check              ┌──────────────┘        │  │
│  │   (Bearer Token)          ▼                       │  │
│  │                    ┌────────────┐                  │  │
│  │                    │ Delivery   │                  │  │
│  │                    │ Receiver   │──▶ Webhook POST  │  │
│  │                    └────────────┘    to backend    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │          React Native UI (Dashboard)              │  │
│  │  ┌──────────┐ ┌───────┐ ┌──────────┐ ┌────────┐  │  │
│  │  │Dashboard │ │Queue  │ │Settings  │ │Logs    │  │  │
│  │  │Screen    │ │Screen │ │Screen    │ │Screen  │  │  │
│  │  └──────────┘ └───────┘ └──────────┘ └────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow (sending a message)

1. Backend sends `POST http://<device-ip>:8080/send` with JSON body and `Authorization: Bearer <token>`
2. `SmsHttpServer` validates the token via `AuthMiddleware`
3. Server writes the message to Room DB with status `QUEUED`
4. Server returns `202 Accepted` with the message ID immediately
5. `MessageQueue` picks up the next `QUEUED` message after the configured delay
6. `SimManager` selects the SIM (explicit or round-robin)
7. `SmsDispatcher` calls `SmsManager.sendTextMessage()` with a `PendingIntent`
8. Android OS fires `SENT_ACTION` -- status updated to `SENT` or `FAILED`
9. Android OS fires `DELIVERED_ACTION` -- `DeliveryReceiver` catches it
10. `WebhookClient` sends delivery status to the backend's configured webhook URL

---

## 4. Implementation Phases

### Phase 1: Project Scaffolding & Core Native Modules (Week 1-2)

| Task | Details |
|------|---------|
| Initialize RN project | `npx @react-native-community/cli init SmsGateway --template react-native-template-typescript` |
| Configure Android permissions | Update `AndroidManifest.xml` with all required permissions (SEND_SMS, READ_PHONE_STATE, INTERNET, ACCESS_WIFI_STATE, FOREGROUND_SERVICE, FOREGROUND_SERVICE_DATA_SYNC, WAKE_LOCK) |
| Set up Room database | Create `AppDatabase`, `MessageEntity`, `MessageDao` in Kotlin |
| Build `DatabaseModule` bridge | Expose insert/query/update operations to JS |
| Set up Foreground Service | Implement `GatewayForegroundService` with persistent notification and WAKE_LOCK |
| Build `ServiceModule` bridge | Start/stop service from JS |

### Phase 2: HTTP Server & Authentication (Week 2-3)

| Task | Details |
|------|---------|
| Integrate NanoHTTPD | Add `nanohttpd` dependency, implement `SmsHttpServer` |
| Implement `POST /send` | Parse JSON body, validate fields, insert into Room |
| Implement `GET /status` | Return server uptime, queue depth, SIM info |
| Implement `GET /messages/:id` | Return message status by ID |
| Implement `AuthMiddleware` | Validate `Authorization: Bearer <token>` header |
| Build `ServerModule` bridge | Start/stop server, configure port and token from JS |

### Phase 3: SMS Engine & SIM Management (Week 3-4)

| Task | Details |
|------|---------|
| Implement `SimManager` | Detect SIMs via `SubscriptionManager`, track rotation state |
| Implement `SmsDispatcher` | Send SMS via `SmsManager`, register `PendingIntent` for SENT/DELIVERED |
| Implement `DeliveryReceiver` | `BroadcastReceiver` for delivery reports |
| Implement `MessageQueue` | Timer-based queue processor with configurable delay |
| Implement `RetryPolicy` | Exponential backoff: 1min, 5min, 15min... up to 20 retries |
| Build `SmsModule` bridge | Expose SIM info and manual send to JS |

### Phase 4: Webhooks & Rate Limiting (Week 4-5)

| Task | Details |
|------|---------|
| Implement `WebhookClient` | OkHttp POST to backend with message ID and status |
| Implement rate limiting | Per-SIM daily counters, pause queue at threshold |
| Implement throttle delay | Configurable 15-30s delay between sends |
| Implement daily reset | Reset counters at midnight |
| Build `WebhookModule` bridge | Configure webhook URL from JS |

### Phase 5: React Native UI (Week 5-6)

| Task | Details |
|------|---------|
| Set up navigation | Bottom tab navigator with 4 screens |
| Build Dashboard screen | Server status, SIM status cards, today's stats |
| Build Queue screen | FlatList of messages with status filters |
| Build Settings screen | Port, API key, webhook URL, delay slider, daily limits |
| Build Logs screen | Scrollable activity log |
| Connect stores to native modules | Zustand stores listening to native events |

### Phase 6: Testing, Hardening & Documentation (Week 6-7)

| Task | Details |
|------|---------|
| Write unit tests (JS) | Jest tests for stores, utilities, component rendering |
| Write unit tests (Kotlin) | JUnit tests for RetryPolicy, AuthMiddleware, queue logic |
| Integration testing | End-to-end test with real device (manual) |
| Edge case handling | No SIM, airplane mode, low battery, OS kill recovery |
| Write README | Setup instructions, ADB commands, API docs |
| Build release APK | Signed APK with ProGuard |

---

## 5. Native Module Design

### 5.1 ServerModule

```typescript
// TypeScript interface (src/native/ServerBridge.ts)
interface ServerBridge {
  startServer(port: number, apiKey: string): Promise<void>;
  stopServer(): Promise<void>;
  getServerStatus(): Promise<{
    running: boolean;
    port: number;
    ipAddress: string;
    uptime: number;
  }>;
  // Events emitted to JS
  // 'onRequestReceived' -> { id, phoneNumber, timestamp }
}
```

**Kotlin implementation highlights:**
- `SmsHttpServer` extends `NanoHTTPD`
- Runs on a background thread inside the Foreground Service
- Routes: `POST /send`, `GET /status`, `GET /messages/:id`
- All request handling is synchronous on NanoHTTPD's thread pool -- message is inserted into Room and a 202 is returned immediately

### 5.2 SmsModule

```typescript
// TypeScript interface (src/native/SmsBridge.ts)
interface SmsBridge {
  getSimCards(): Promise<Array<{
    slotIndex: number;
    subscriptionId: number;
    carrierName: string;
    phoneNumber: string | null;
    isActive: boolean;
  }>>;
  getSimStats(): Promise<Array<{
    slotIndex: number;
    sentToday: number;
    dailyLimit: number;
  }>>;
  // Events emitted to JS
  // 'onSmsSent' -> { messageId, status }
  // 'onSmsDelivered' -> { messageId, status }
}
```

### 5.3 QueueModule

```typescript
// TypeScript interface (src/native/QueueBridge.ts)
interface QueueBridge {
  startProcessing(): Promise<void>;
  stopProcessing(): Promise<void>;
  getQueueStats(): Promise<{
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    processing: boolean;
  }>;
  retryMessage(messageId: string): Promise<void>;
  clearCompleted(): Promise<void>;
  // Events emitted to JS
  // 'onQueueUpdate' -> { queued, sent, delivered, failed }
}
```

### 5.4 DatabaseModule

```typescript
// TypeScript interface (src/native/DatabaseBridge.ts)
interface DatabaseBridge {
  getMessages(filter?: string, limit?: number, offset?: number): Promise<Message[]>;
  getMessage(id: string): Promise<Message | null>;
  deleteMessage(id: string): Promise<void>;
  getStats(): Promise<{
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}
```

### 5.5 ServiceModule

```typescript
// TypeScript interface (src/native/ServiceBridge.ts)
interface ServiceBridge {
  startService(): Promise<void>;
  stopService(): Promise<void>;
  isServiceRunning(): Promise<boolean>;
}
```

### 5.6 WebhookModule

```typescript
// TypeScript interface (src/native/WebhookBridge.ts)
interface WebhookBridge {
  setWebhookUrl(url: string): Promise<void>;
  getWebhookUrl(): Promise<string | null>;
  testWebhook(): Promise<{ success: boolean; statusCode: number }>;
}
```

---

## 6. Database Schema

### `messages` table (Room Entity)

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) PK | Unique message identifier |
| `phone_number` | TEXT NOT NULL | Recipient phone number |
| `message_text` | TEXT NOT NULL | SMS body |
| `status` | TEXT NOT NULL | `QUEUED`, `SENDING`, `SENT`, `DELIVERED`, `FAILED` |
| `sim_slot` | INTEGER | 1 or 2 (null = auto-rotate) |
| `used_sim_slot` | INTEGER | Actual SIM used for sending |
| `retry_count` | INTEGER DEFAULT 0 | Number of retry attempts |
| `max_retries` | INTEGER DEFAULT 20 | Maximum retry attempts |
| `error_code` | TEXT | Last error code if failed |
| `webhook_sent` | INTEGER DEFAULT 0 | 1 if delivery webhook was sent |
| `created_at` | INTEGER NOT NULL | Epoch ms when request was received |
| `sent_at` | INTEGER | Epoch ms when SMS was dispatched |
| `delivered_at` | INTEGER | Epoch ms when delivery confirmed |
| `next_retry_at` | INTEGER | Epoch ms for next retry attempt |

### `daily_counts` table

| Column | Type | Description |
|--------|------|-------------|
| `date` | TEXT PK | Date string (YYYY-MM-DD) |
| `sim1_count` | INTEGER DEFAULT 0 | Messages sent via SIM 1 today |
| `sim2_count` | INTEGER DEFAULT 0 | Messages sent via SIM 2 today |

### `activity_log` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | Log entry ID |
| `timestamp` | INTEGER NOT NULL | Epoch ms |
| `level` | TEXT NOT NULL | `INFO`, `WARN`, `ERROR` |
| `message` | TEXT NOT NULL | Human-readable log message |
| `message_id` | TEXT | Related message ID (nullable) |

---

## 7. API Specification

### POST /send

**Request:**
```http
POST /send HTTP/1.1
Host: 192.168.1.100:8080
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "phoneNumber": "+639171234567",
  "messageText": "Your OTP is 123456",
  "simSlot": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phoneNumber` | string | Yes | Recipient in E.164 or local format |
| `messageText` | string | Yes | SMS body (max 160 chars for single SMS, auto-split for longer) |
| `simSlot` | number | No | `1` or `2`. If omitted, auto-rotates |

**Response (202 Accepted):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "QUEUED",
  "createdAt": "2026-03-26T09:00:00.000Z"
}
```

**Error Responses:**

| Code | Body | Condition |
|------|------|-----------|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid Bearer token |
| 400 | `{ "error": "phoneNumber is required" }` | Validation failure |
| 429 | `{ "error": "Daily limit reached for SIM 1" }` | Rate limit exceeded |
| 503 | `{ "error": "Service not running" }` | Foreground service down |

### GET /status

**Response (200 OK):**
```json
{
  "server": {
    "running": true,
    "uptime": 3600,
    "port": 8080
  },
  "sims": [
    { "slot": 1, "carrier": "Globe", "sentToday": 245, "dailyLimit": 700, "active": true },
    { "slot": 2, "carrier": "Smart", "sentToday": 243, "dailyLimit": 700, "active": true }
  ],
  "queue": {
    "queued": 12,
    "sent": 488,
    "delivered": 470,
    "failed": 3
  }
}
```

### GET /messages/:id

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phoneNumber": "+639171234567",
  "messageText": "Your OTP is 123456",
  "status": "DELIVERED",
  "simSlot": 1,
  "retryCount": 0,
  "createdAt": "2026-03-26T09:00:00.000Z",
  "sentAt": "2026-03-26T09:00:15.000Z",
  "deliveredAt": "2026-03-26T09:00:22.000Z"
}
```

### Webhook Payload (outbound)

```http
POST /webhook/sms-status HTTP/1.1
Host: backend-server.local
Content-Type: application/json

{
  "messageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "DELIVERED",
  "simSlot": 1,
  "deliveredAt": "2026-03-26T09:00:22.000Z"
}
```

---

## 8. State Management

### Zustand Stores

#### `useServerStore`
```typescript
interface ServerState {
  running: boolean;
  port: number;
  ipAddress: string;
  uptime: number;
  apiKey: string;

  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}
```

#### `useQueueStore`
```typescript
interface QueueState {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  processing: boolean;
  messages: Message[];

  refreshStats: () => Promise<void>;
  loadMessages: (filter?: string) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
}
```

#### `useSettingsStore`
```typescript
interface SettingsState {
  port: number;
  apiKey: string;
  webhookUrl: string;
  delayBetweenMessages: number;  // seconds
  dailyLimitPerSim: number;
  autoRotateSim: boolean;

  updateSetting: (key: string, value: any) => Promise<void>;
  loadSettings: () => Promise<void>;
}
```

Settings are persisted using `AsyncStorage` on the JS side and synchronized to native modules on change.

---

## 9. UI Screens

### Dashboard Screen
- **Server status card**: Running/Stopped toggle, IP address, port
- **SIM status cards**: For each SIM -- carrier name, sent today / daily limit, progress bar
- **Today's stats**: Total queued, sent, delivered, failed
- **Quick actions**: Start/Stop server button

### Queue Screen
- **Filter tabs**: All | Queued | Sent | Delivered | Failed
- **Message list**: FlatList with phone number, status badge, timestamp
- **Pull-to-refresh**: Reload from Room DB
- **Tap to expand**: Show full message text, retry count, error details
- **Retry button**: On failed messages

### Settings Screen
- **Server section**: Port number input, API key input (with copy/regenerate), Auto-start on boot toggle
- **Throttling section**: Delay slider (15-60 seconds), Daily limit per SIM input
- **SIM section**: Auto-rotate toggle, preferred SIM selector
- **Webhook section**: Webhook URL input, Test webhook button
- **ADB instructions**: Read-only text showing required ADB commands

### Logs Screen
- **Activity log**: Reverse-chronological scrollable list
- **Log level filters**: INFO, WARN, ERROR
- **Clear logs button**

---

## 10. Testing Strategy

### Unit Tests (JavaScript - Jest)

| Area | Tests |
|------|-------|
| Zustand stores | State transitions, action side effects |
| Utility functions | Phone number formatting, date formatting |
| Components | Render tests with React Native Testing Library |
| Native bridge mocks | Mock NativeModules, verify correct calls |

### Unit Tests (Kotlin - JUnit)

| Area | Tests |
|------|-------|
| `RetryPolicy` | Backoff intervals, max retry enforcement |
| `AuthMiddleware` | Token validation, rejection of bad tokens |
| `MessageQueue` | Ordering, throttle timing, SIM rotation |
| `Room DAO` | Insert, query, update status transitions |

### Integration Tests (Manual - Physical Device)

| Scenario | Steps |
|----------|-------|
| Send single SMS | POST to /send, verify SMS received |
| SIM rotation | Send 10 messages without simSlot, verify alternation |
| Rate limit | Set daily limit to 5, send 6, verify 6th is rejected |
| Retry on failure | Enable airplane mode, send message, disable airplane mode, verify retry |
| Webhook delivery | Send message, verify webhook received on backend |
| Service persistence | Send batch, lock phone for 30 min, verify queue continues |

---

## 11. Build & Deployment

### Prerequisites
- Node.js 18+
- JDK 17
- Android SDK 34 (target), min SDK 26 (Android 8.0)
- Physical Android device with dual SIM (emulators do not support real SMS)

### ADB Commands (run once on device)
```bash
# Increase OS-level SMS rate limit
adb shell settings put global sms_outgoing_check_max_count 2000
adb shell settings put global sms_outgoing_check_interval_ms 86400000

# Disable battery optimization for the app
adb shell dumpsys deviceidle whitelist +com.smsgateway
```

### Build Commands
```bash
# Development
npx react-native run-android

# Release APK
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Gradle Dependencies (android/app/build.gradle.kts)
```kotlin
dependencies {
    // NanoHTTPD
    implementation("org.nanohttpd:nanohttpd:2.3.1")

    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")

    // OkHttp (for webhooks)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}
```

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Carrier blocks SMS** | Messages fail after certain volume | SIM rotation, throttle delays, stay under 700/SIM/day |
| **Android kills Foreground Service** | Queue stalls | Persistent notification, WAKE_LOCK, battery optimization whitelist, `START_STICKY` |
| **Wi-Fi disconnects** | HTTP server unreachable | Show connection status in UI, auto-restart server on reconnect |
| **Device reboots** | Service stops | Implement `BOOT_COMPLETED` receiver to auto-start service |
| **Room DB corruption** | Message data lost | WAL mode enabled by default, periodic backup to external storage |
| **React Native bridge overhead** | Slow message processing | All critical path code runs in Kotlin; JS only reads state for display |
| **NanoHTTPD thread exhaustion** | Server unresponsive under load | Default thread pool is sufficient for expected throughput (~1 msg/15s); add connection limit if needed |

---

## Summary

This plan delivers a dual-layer architecture:

1. **Native Kotlin layer** handles everything on the critical path: HTTP server, SMS dispatch, SIM management, queue processing, delivery reports, and webhooks. This runs inside an Android Foreground Service and is resilient to OS power management.

2. **React Native layer** provides a clean dashboard UI for monitoring and configuration. It communicates with the native layer through well-defined bridge modules.

The phased approach allows for incremental delivery and testing, with the most critical functionality (native modules) built first and the UI layer added on top.
