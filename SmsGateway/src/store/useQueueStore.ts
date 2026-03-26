import {create} from 'zustand';
import {QueueBridge, QueueEvents} from '../native/QueueBridge';
import {DatabaseBridge} from '../native/DatabaseBridge';
import type {Message, MessageStatus, QueueStats} from '../types/message';

interface QueueState {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  processing: boolean;
  messages: Message[];
  currentFilter: MessageStatus | null;
  loading: boolean;
  error: string | null;

  refreshStats: () => Promise<void>;
  loadMessages: (filter?: MessageStatus) => Promise<void>;
  startProcessing: () => Promise<void>;
  stopProcessing: () => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearError: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queued: 0,
  sent: 0,
  delivered: 0,
  failed: 0,
  processing: false,
  messages: [],
  currentFilter: null,
  loading: false,
  error: null,

  refreshStats: async () => {
    try {
      const stats: QueueStats = await QueueBridge.getQueueStats();
      set({
        queued: stats.queued,
        sent: stats.sent,
        delivered: stats.delivered,
        failed: stats.failed,
        processing: stats.processing,
      });
    } catch (err: any) {
      set({error: err.message ?? 'Failed to refresh stats'});
    }
  },

  loadMessages: async (filter?: MessageStatus) => {
    set({loading: true, currentFilter: filter ?? null});
    try {
      const messages = await DatabaseBridge.getMessages(filter, 100, 0);
      set({messages, loading: false});
    } catch (err: any) {
      set({loading: false, error: err.message ?? 'Failed to load messages'});
    }
  },

  startProcessing: async () => {
    try {
      await QueueBridge.startProcessing();
      set({processing: true});
    } catch (err: any) {
      set({error: err.message ?? 'Failed to start processing'});
    }
  },

  stopProcessing: async () => {
    try {
      await QueueBridge.stopProcessing();
      set({processing: false});
    } catch (err: any) {
      set({error: err.message ?? 'Failed to stop processing'});
    }
  },

  retryMessage: async (id: string) => {
    try {
      await QueueBridge.retryMessage(id);
      // Reload messages with current filter
      const {currentFilter} = get();
      const messages = await DatabaseBridge.getMessages(
        currentFilter ?? undefined,
        100,
        0,
      );
      set({messages});
    } catch (err: any) {
      set({error: err.message ?? 'Failed to retry message'});
    }
  },

  clearCompleted: async () => {
    try {
      await QueueBridge.clearCompleted();
      const {currentFilter} = get();
      const messages = await DatabaseBridge.getMessages(
        currentFilter ?? undefined,
        100,
        0,
      );
      const stats = await QueueBridge.getQueueStats();
      set({
        messages,
        queued: stats.queued,
        sent: stats.sent,
        delivered: stats.delivered,
        failed: stats.failed,
      });
    } catch (err: any) {
      set({error: err.message ?? 'Failed to clear completed'});
    }
  },

  clearError: () => set({error: null}),
}));

// Listen for native queue updates
QueueEvents.addListener('onQueueUpdate', (stats: QueueStats) => {
  useQueueStore.setState({
    queued: stats.queued,
    sent: stats.sent,
    delivered: stats.delivered,
    failed: stats.failed,
    processing: stats.processing,
  });
});
