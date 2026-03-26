export type MessageStatus =
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED';

export interface Message {
  id: string;
  phoneNumber: string;
  messageText: string;
  status: MessageStatus;
  simSlot: number | null;
  usedSimSlot: number | null;
  retryCount: number;
  maxRetries: number;
  errorCode: string | null;
  webhookSent: boolean;
  createdAt: number;
  sentAt: number | null;
  deliveredAt: number | null;
  nextRetryAt: number | null;
}

export interface QueueStats {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  processing: boolean;
}

export interface DatabaseStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
}
