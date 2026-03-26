// Mock NativeModules for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.ServerModule = {
    startServer: jest.fn(() => Promise.resolve()),
    stopServer: jest.fn(() => Promise.resolve()),
    getServerStatus: jest.fn(() =>
      Promise.resolve({
        running: false,
        port: 8080,
        ipAddress: '0.0.0.0',
        uptime: 0,
      }),
    ),
  };
  RN.NativeModules.SmsModule = {
    getSimCards: jest.fn(() => Promise.resolve([])),
    getSimStats: jest.fn(() => Promise.resolve([])),
  };
  RN.NativeModules.QueueModule = {
    startProcessing: jest.fn(() => Promise.resolve()),
    stopProcessing: jest.fn(() => Promise.resolve()),
    getQueueStats: jest.fn(() =>
      Promise.resolve({
        queued: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        processing: false,
      }),
    ),
    retryMessage: jest.fn(() => Promise.resolve()),
    clearCompleted: jest.fn(() => Promise.resolve()),
  };
  RN.NativeModules.DatabaseModule = {
    getMessages: jest.fn(() => Promise.resolve([])),
    getMessage: jest.fn(() => Promise.resolve(null)),
    deleteMessage: jest.fn(() => Promise.resolve()),
    getStats: jest.fn(() =>
      Promise.resolve({total: 0, queued: 0, sent: 0, delivered: 0, failed: 0}),
    ),
  };
  RN.NativeModules.ServiceModule = {
    startService: jest.fn(() => Promise.resolve()),
    stopService: jest.fn(() => Promise.resolve()),
    isServiceRunning: jest.fn(() => Promise.resolve(false)),
  };
  RN.NativeModules.WebhookModule = {
    setWebhookUrl: jest.fn(() => Promise.resolve()),
    getWebhookUrl: jest.fn(() => Promise.resolve(null)),
    testWebhook: jest.fn(() =>
      Promise.resolve({success: true, statusCode: 200}),
    ),
  };
  return RN;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
