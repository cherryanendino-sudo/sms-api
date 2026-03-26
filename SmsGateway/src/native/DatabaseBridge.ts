import {NativeModules} from 'react-native';
import type {Message, DatabaseStats, MessageStatus} from '../types/message';

const {DatabaseModule} = NativeModules;

export const DatabaseBridge = {
  /**
   * Query messages with optional status filter, limit, and offset.
   */
  getMessages(
    filter?: MessageStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    return DatabaseModule.getMessages(filter ?? null, limit, offset);
  },

  /**
   * Get a single message by ID.
   */
  getMessage(id: string): Promise<Message | null> {
    return DatabaseModule.getMessage(id);
  },

  /**
   * Delete a message by ID.
   */
  deleteMessage(id: string): Promise<void> {
    return DatabaseModule.deleteMessage(id);
  },

  /**
   * Get aggregate statistics for all messages.
   */
  getStats(): Promise<DatabaseStats> {
    return DatabaseModule.getStats();
  },
};
