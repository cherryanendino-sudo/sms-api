import {NativeModules, NativeEventEmitter} from 'react-native';
import type {ServerStatus} from '../types/api';

const {ServerModule} = NativeModules;

export const ServerEvents = new NativeEventEmitter(ServerModule);

/**
 * Event types emitted by the server module:
 * - 'onRequestReceived': { id: string, phoneNumber: string, timestamp: number }
 * - 'onServerStatusChanged': { running: boolean }
 */

export const ServerBridge = {
  /**
   * Start the embedded HTTP server on the given port.
   * The server will validate requests using the provided API key.
   */
  startServer(port: number, apiKey: string): Promise<void> {
    return ServerModule.startServer(port, apiKey);
  },

  /**
   * Stop the embedded HTTP server.
   */
  stopServer(): Promise<void> {
    return ServerModule.stopServer();
  },

  /**
   * Get the current server status including IP address and uptime.
   */
  getServerStatus(): Promise<ServerStatus> {
    return ServerModule.getServerStatus();
  },
};
