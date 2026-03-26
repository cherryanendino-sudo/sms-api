import {NativeModules} from 'react-native';

const {ServiceModule} = NativeModules;

export const ServiceBridge = {
  /**
   * Start the foreground service with persistent notification.
   * This keeps the app alive and the CPU awake for queue processing.
   */
  startService(): Promise<void> {
    return ServiceModule.startService();
  },

  /**
   * Stop the foreground service. Queue processing will halt.
   */
  stopService(): Promise<void> {
    return ServiceModule.stopService();
  },

  /**
   * Check whether the foreground service is currently running.
   */
  isServiceRunning(): Promise<boolean> {
    return ServiceModule.isServiceRunning();
  },
};
