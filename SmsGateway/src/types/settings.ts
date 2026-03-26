export interface AppSettings {
  port: number;
  apiKey: string;
  webhookUrl: string;
  delayBetweenMessages: number;
  dailyLimitPerSim: number;
  autoRotateSim: boolean;
  autoStartOnBoot: boolean;
  preferredSim: number | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  port: 8080,
  apiKey: '',
  webhookUrl: '',
  delayBetweenMessages: 20,
  dailyLimitPerSim: 700,
  autoRotateSim: true,
  autoStartOnBoot: true,
  preferredSim: null,
};
