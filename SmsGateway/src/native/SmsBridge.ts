import {NativeModules, NativeEventEmitter} from 'react-native';
import type {SimCard, SimStats} from '../types/api';

const {SmsModule} = NativeModules;

export const SmsEvents = new NativeEventEmitter(SmsModule);

/**
 * Event types emitted by the SMS module:
 * - 'onSmsSent': { messageId: string, status: 'SENT' | 'FAILED', errorCode?: string }
 * - 'onSmsDelivered': { messageId: string, status: 'DELIVERED' }
 */

export const SmsBridge = {
  /**
   * Get information about all detected SIM cards.
   */
  getSimCards(): Promise<SimCard[]> {
    return SmsModule.getSimCards();
  },

  /**
   * Get sending statistics per SIM for today.
   */
  getSimStats(): Promise<SimStats[]> {
    return SmsModule.getSimStats();
  },
};
