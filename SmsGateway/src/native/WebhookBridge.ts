import {NativeModules} from 'react-native';
import type {WebhookTestResult} from '../types/api';

const {WebhookModule} = NativeModules;

export const WebhookBridge = {
  /**
   * Set the URL where delivery status webhooks will be sent.
   */
  setWebhookUrl(url: string): Promise<void> {
    return WebhookModule.setWebhookUrl(url);
  },

  /**
   * Get the currently configured webhook URL.
   */
  getWebhookUrl(): Promise<string | null> {
    return WebhookModule.getWebhookUrl();
  },

  /**
   * Send a test webhook to verify connectivity.
   */
  testWebhook(): Promise<WebhookTestResult> {
    return WebhookModule.testWebhook();
  },
};
