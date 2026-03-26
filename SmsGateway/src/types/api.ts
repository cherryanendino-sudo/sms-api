export interface SendRequest {
  phoneNumber: string;
  messageText: string;
  simSlot?: 1 | 2;
}

export interface SendResponse {
  id: string;
  status: 'QUEUED';
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
}

export interface StatusResponse {
  server: {
    running: boolean;
    uptime: number;
    port: number;
  };
  sims: SimStatus[];
  queue: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
  };
}

export interface SimStatus {
  slot: number;
  carrier: string;
  sentToday: number;
  dailyLimit: number;
  active: boolean;
}

export interface SimCard {
  slotIndex: number;
  subscriptionId: number;
  carrierName: string;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface SimStats {
  slotIndex: number;
  sentToday: number;
  dailyLimit: number;
}

export interface ServerStatus {
  running: boolean;
  port: number;
  ipAddress: string;
  uptime: number;
}

export interface WebhookPayload {
  messageId: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  simSlot: number;
  deliveredAt?: string;
  sentAt?: string;
  errorCode?: string;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
}
