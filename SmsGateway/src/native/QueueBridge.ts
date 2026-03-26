import {NativeModules, NativeEventEmitter} from 'react-native';
import type {QueueStats} from '../types/message';

const {QueueModule} = NativeModules;

export const QueueEvents = new NativeEventEmitter(QueueModule);

/**
 * Event types emitted by the queue module:
 * - 'onQueueUpdate': QueueStats
 * - 'onMessageProcessed': { messageId: string, status: string }
 */

export const QueueBridge = {
  /**
   * Start processing the message queue with configured delay.
   */
  startProcessing(): Promise<void> {
    return QueueModule.startProcessing();
  },

  /**
   * Pause queue processing. Messages remain in queue.
   */
  stopProcessing(): Promise<void> {
    return QueueModule.stopProcessing();
  },

  /**
   * Get current queue statistics.
   */
  getQueueStats(): Promise<QueueStats> {
    return QueueModule.getQueueStats();
  },

  /**
   * Retry a specific failed message.
   */
  retryMessage(messageId: string): Promise<void> {
    return QueueModule.retryMessage(messageId);
  },

  /**
   * Remove all completed (DELIVERED) and FAILED messages from the database.
   */
  clearCompleted(): Promise<void> {
    return QueueModule.clearCompleted();
  },
};
