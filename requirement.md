## 1. Product Overview
### Purpose
The objective is to develop a custom Android application that transforms a standard dual-SIM Android smartphone into a programmable SMS Gateway. It will receive HTTP or WebSocket requests from a backend server and programmatically dispatch those payloads as SMS messages over the carrier network. [github](https://github.com/jerrymannel/smsgateway)

### Scope
The application will act as a bridge between a local backend system and the mobile carrier. It will manage incoming message queues, handle dual-SIM rotation to distribute message loads, enforce sending delays to prevent carrier spam-blocking, and return delivery status webhooks to the backend. [docs.sms-gate](https://docs.sms-gate.app/faq/general/)

## 2. System Architecture
The application will use a **Local Server Architecture**:
- **Communication Protocol:** The Android app will run a lightweight embedded HTTP server (e.g., Ktor or NanoHTTPD) on a specific port (e.g., `8080`). [github](https://github.com/jerrymannel/smsgateway)
- **Network Environment:** The Android device and the backend server must be on the same local area network (LAN/Wi-Fi). 
- **Message Flow:** The backend sends a `POST` request to the Android app’s IP address. The app queues the message locally (using SQLite/Room) and processes the queue sequentially. [reddit](https://www.reddit.com/r/opensource/comments/bhos0t/android_sms_gateway_application_for_sending_and/)

## 3. Functional Requirements (FR)

### FR1: Message Dispatch via API
- The app must expose a `POST /send` endpoint accepting a JSON payload containing `phoneNumber` and `messageText`.
- The app must use the native Android `SmsManager` to dispatch the message over the cellular network.

### FR2: Multi-SIM Management & Rotation
- The app must detect inserted SIM cards using the Android `SubscriptionManager`.
- The API payload must allow an optional `simSlot` parameter (values: `1` or `2`) to force a specific SIM. [docs.sms-gate](https://docs.sms-gate.app/faq/general/)
- If no SIM is specified, the app must auto-rotate between SIM 1 and SIM 2 for each subsequent message to balance the 1,300 daily messages across two numbers (650 messages per SIM). [docs.sms-gate](https://docs.sms-gate.app/faq/general/)

### FR3: Anti-Spam Throttling (Rate Limiting)
- The app must implement an adjustable "Delay Between Messages" (e.g., 15 to 30 seconds) to simulate human sending patterns and bypass telecom Fair Use Policy (FUP) filters. [docs.sms-gate](https://docs.sms-gate.app/faq/general/)
- The app must support daily limits per SIM (e.g., cap at 700/day per SIM) and pause the queue if the threshold is reached. [docs.sms-gate](https://docs.sms-gate.app/faq/general/)

### FR4: Local Queuing & Retry Mechanism
- The app must persist incoming API requests in a local SQLite database before sending.
- If a message fails due to temporary errors (e.g., `RESULT_ERROR_NO_SERVICE` or `RESULT_ERROR_RADIO_OFF`), the app must execute an incremental retry backoff (e.g., retry in 1 minute, then 5 minutes, up to a max of 20 attempts) before marking it as "FAILED". [github](https://github.com/multiOTP/SMSGatewayApp)

### FR5: Delivery Reports (Webhooks)
- The app must listen for Android's `DELIVERED_ACTION` intent.
- Upon successful delivery to the recipient's handset, the app must fire a webhook (HTTP POST) back to the backend server with the message ID and a `DELIVERED` status. [reddit](https://www.reddit.com/r/opensource/comments/bhos0t/android_sms_gateway_application_for_sending_and/)

## 4. Non-Functional Requirements (NFR)

### NFR1: Background Persistence (Foreground Service)
- Android operating systems aggressively put background apps to sleep (Doze Mode). The application **must** be implemented as a Foreground Service with a persistent, non-dismissible notification. [github](https://github.com/jerrymannel/smsgateway)
- The app must hold a partial `WAKE_LOCK` to ensure the CPU does not sleep while processing the batch of messages.

### NFR2: Security
- The local API must be secured using a Bearer Token or API Key in the HTTP headers to prevent unauthorized devices on the local network from sending SMS messages through your phone.

### NFR3: OS Configuration Overrides
- The user must override default Android OS SMS rate limits via ADB commands to prevent the OS from blocking the app (e.g., `adb shell settings put global sms_outgoing_check_max_count 2000`). [github](https://github.com/multiOTP/SMSGatewayApp)

## 5. System Permissions Requirements
To build and deploy this app, the `AndroidManifest.xml` must declare the following permissions:
- `SEND_SMS`: Required to dispatch texts.
- `READ_PHONE_STATE`: Required to detect dual SIMs and network connectivity. [github](https://github.com/multiOTP/SMSGatewayApp)
- `INTERNET` / `ACCESS_WIFI_STATE`: Required to run the local HTTP server and send webhooks.
- `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_DATA_SYNC`: Required to keep the app running indefinitely.
- `WAKE_LOCK`: Required to keep the processor awake.

Would you prefer the app to pull messages from your server's database periodically (Polling), or should your server push messages directly to the app (Push)?
