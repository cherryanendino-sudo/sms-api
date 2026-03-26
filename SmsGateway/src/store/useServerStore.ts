import {create} from 'zustand';
import {ServerBridge, ServerEvents} from '../native/ServerBridge';
import {ServiceBridge} from '../native/ServiceBridge';
import type {ServerStatus} from '../types/api';

interface ServerState {
  running: boolean;
  port: number;
  ipAddress: string;
  uptime: number;
  serviceRunning: boolean;
  loading: boolean;
  error: string | null;

  startServer: (port: number, apiKey: string) => Promise<void>;
  stopServer: () => Promise<void>;
  startService: () => Promise<void>;
  stopService: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  running: false,
  port: 8080,
  ipAddress: '0.0.0.0',
  uptime: 0,
  serviceRunning: false,
  loading: false,
  error: null,

  startServer: async (port: number, apiKey: string) => {
    set({loading: true, error: null});
    try {
      await ServiceBridge.startService();
      await ServerBridge.startServer(port, apiKey);
      const status = await ServerBridge.getServerStatus();
      set({
        running: status.running,
        port: status.port,
        ipAddress: status.ipAddress,
        uptime: status.uptime,
        serviceRunning: true,
        loading: false,
      });
    } catch (err: any) {
      set({loading: false, error: err.message ?? 'Failed to start server'});
    }
  },

  stopServer: async () => {
    set({loading: true, error: null});
    try {
      await ServerBridge.stopServer();
      await ServiceBridge.stopService();
      set({
        running: false,
        uptime: 0,
        serviceRunning: false,
        loading: false,
      });
    } catch (err: any) {
      set({loading: false, error: err.message ?? 'Failed to stop server'});
    }
  },

  startService: async () => {
    try {
      await ServiceBridge.startService();
      set({serviceRunning: true});
    } catch (err: any) {
      set({error: err.message ?? 'Failed to start service'});
    }
  },

  stopService: async () => {
    try {
      await ServiceBridge.stopService();
      set({serviceRunning: false});
    } catch (err: any) {
      set({error: err.message ?? 'Failed to stop service'});
    }
  },

  refreshStatus: async () => {
    try {
      const status: ServerStatus = await ServerBridge.getServerStatus();
      const serviceRunning = await ServiceBridge.isServiceRunning();
      set({
        running: status.running,
        port: status.port,
        ipAddress: status.ipAddress,
        uptime: status.uptime,
        serviceRunning,
      });
    } catch (err: any) {
      set({error: err.message ?? 'Failed to refresh status'});
    }
  },

  clearError: () => set({error: null}),
}));

// Listen for native server status changes
ServerEvents.addListener('onServerStatusChanged', (event: {running: boolean}) => {
  useServerStore.setState({running: event.running});
});
