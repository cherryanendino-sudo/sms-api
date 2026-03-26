import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebhookBridge} from '../native/WebhookBridge';
import type {AppSettings} from '../types/settings';
import {DEFAULT_SETTINGS} from '../types/settings';

const STORAGE_KEY = '@sms_gateway_settings';

interface SettingsState extends AppSettings {
  loaded: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  generateApiKey: () => Promise<void>;
}

function generateRandomKey(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Partial<AppSettings> = JSON.parse(raw);
        const merged = {...DEFAULT_SETTINGS, ...saved};
        set({...merged, loaded: true});

        // Sync webhook URL to native module
        if (merged.webhookUrl) {
          await WebhookBridge.setWebhookUrl(merged.webhookUrl);
        }
      } else {
        // First run: generate an API key
        const apiKey = generateRandomKey();
        const initial = {...DEFAULT_SETTINGS, apiKey};
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        set({...initial, loaded: true});
      }
    } catch (err) {
      // Fall back to defaults
      set({...DEFAULT_SETTINGS, loaded: true});
    }
  },

  updateSetting: async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const current = get();
    const updated = {...current, [key]: value};

    // Persist
    const toSave: AppSettings = {
      port: updated.port,
      apiKey: updated.apiKey,
      webhookUrl: updated.webhookUrl,
      delayBetweenMessages: updated.delayBetweenMessages,
      dailyLimitPerSim: updated.dailyLimitPerSim,
      autoRotateSim: updated.autoRotateSim,
      autoStartOnBoot: updated.autoStartOnBoot,
      preferredSim: updated.preferredSim,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    set({[key]: value} as any);

    // Sync specific settings to native modules
    if (key === 'webhookUrl' && typeof value === 'string') {
      await WebhookBridge.setWebhookUrl(value);
    }
  },

  resetSettings: async () => {
    const apiKey = generateRandomKey();
    const fresh = {...DEFAULT_SETTINGS, apiKey};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    set({...fresh});
  },

  generateApiKey: async () => {
    const apiKey = generateRandomKey();
    const current = get();
    const toSave: AppSettings = {
      port: current.port,
      apiKey,
      webhookUrl: current.webhookUrl,
      delayBetweenMessages: current.delayBetweenMessages,
      dailyLimitPerSim: current.dailyLimitPerSim,
      autoRotateSim: current.autoRotateSim,
      autoStartOnBoot: current.autoStartOnBoot,
      preferredSim: current.preferredSim,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    set({apiKey});
  },
}));
