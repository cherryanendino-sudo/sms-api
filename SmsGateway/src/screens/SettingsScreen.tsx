import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native';
import {useSettingsStore} from '../store/useSettingsStore';
import {useServerStore} from '../store/useServerStore';
import {ThrottleSlider} from '../components/ThrottleSlider';
import {SimSelector} from '../components/SimSelector';
import {SmsBridge} from '../native/SmsBridge';
import {WebhookBridge} from '../native/WebhookBridge';
import type {SimCard} from '../types/api';

export const SettingsScreen: React.FC = () => {
  const settings = useSettingsStore();
  const server = useServerStore();
  const [sims, setSims] = useState<SimCard[]>([]);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(
    null,
  );

  useEffect(() => {
    SmsBridge.getSimCards()
      .then(setSims)
      .catch(() => {});
  }, []);

  const handleCopyApiKey = () => {
    Clipboard.setString(settings.apiKey);
    Alert.alert('Copied', 'API key copied to clipboard');
  };

  const handleRegenerateApiKey = () => {
    Alert.alert(
      'Regenerate API Key',
      'This will invalidate the current key. Any clients using the old key will be rejected.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () => settings.generateApiKey(),
        },
      ],
    );
  };

  const handleTestWebhook = async () => {
    if (!settings.webhookUrl) {
      Alert.alert('No URL', 'Set a webhook URL first');
      return;
    }
    setWebhookTestResult('Testing...');
    try {
      const result = await WebhookBridge.testWebhook();
      setWebhookTestResult(
        result.success
          ? `Success (${result.statusCode})`
          : `Failed (${result.statusCode})`,
      );
    } catch (err: any) {
      setWebhookTestResult(`Error: ${err.message}`);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to defaults? A new API key will be generated.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => settings.resetSettings(),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Server Section */}
      <Text style={styles.sectionTitle}>Server</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={String(settings.port)}
          onChangeText={val => {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0 && num < 65536) {
              settings.updateSetting('port', num);
            }
          }}
          keyboardType="number-pad"
          placeholder="8080"
          placeholderTextColor="#606070"
          editable={!server.running}
        />
        {server.running && (
          <Text style={styles.hint}>Stop the server to change the port</Text>
        )}

        <Text style={[styles.label, {marginTop: 16}]}>API Key</Text>
        <View style={styles.apiKeyRow}>
          <TextInput
            style={[styles.input, {flex: 1}]}
            value={settings.apiKey}
            editable={false}
            selectTextOnFocus
          />
          <TouchableOpacity style={styles.iconButton} onPress={handleCopyApiKey}>
            <Text style={styles.iconButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleRegenerateApiKey}>
          <Text style={styles.link}>Regenerate API Key</Text>
        </TouchableOpacity>
      </View>

      {/* Throttling Section */}
      <Text style={styles.sectionTitle}>Throttling</Text>
      <View style={styles.card}>
        <ThrottleSlider
          label="Delay Between Messages"
          value={settings.delayBetweenMessages}
          min={5}
          max={120}
          unit="sec"
          onValueChange={val =>
            settings.updateSetting('delayBetweenMessages', val)
          }
        />

        <ThrottleSlider
          label="Daily Limit Per SIM"
          value={settings.dailyLimitPerSim}
          min={50}
          max={2000}
          unit="msgs"
          onValueChange={val =>
            settings.updateSetting('dailyLimitPerSim', val)
          }
        />
      </View>

      {/* SIM Section */}
      <Text style={styles.sectionTitle}>SIM Management</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Auto-Rotate SIMs</Text>
          <Switch
            value={settings.autoRotateSim}
            onValueChange={val =>
              settings.updateSetting('autoRotateSim', val)
            }
            trackColor={{false: '#404050', true: '#4CAF5060'}}
            thumbColor={settings.autoRotateSim ? '#4CAF50' : '#808090'}
          />
        </View>
        <Text style={styles.hint}>
          Alternate between SIM 1 and SIM 2 for each message
        </Text>

        {!settings.autoRotateSim && (
          <SimSelector
            sims={sims}
            selectedSim={settings.preferredSim}
            onSelect={slot => settings.updateSetting('preferredSim', slot)}
            autoRotate={settings.autoRotateSim}
          />
        )}
      </View>

      {/* Webhook Section */}
      <Text style={styles.sectionTitle}>Webhook</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Delivery Webhook URL</Text>
        <TextInput
          style={styles.input}
          value={settings.webhookUrl}
          onChangeText={val => settings.updateSetting('webhookUrl', val)}
          placeholder="http://your-server.local/webhook/sms-status"
          placeholderTextColor="#606070"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <View style={styles.webhookActions}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestWebhook}>
            <Text style={styles.testButtonText}>Test Webhook</Text>
          </TouchableOpacity>
          {webhookTestResult && (
            <Text
              style={[
                styles.testResult,
                {
                  color: webhookTestResult.startsWith('Success')
                    ? '#4CAF50'
                    : '#F44336',
                },
              ]}>
              {webhookTestResult}
            </Text>
          )}
        </View>
      </View>

      {/* Boot Section */}
      <Text style={styles.sectionTitle}>System</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Auto-Start on Boot</Text>
          <Switch
            value={settings.autoStartOnBoot}
            onValueChange={val =>
              settings.updateSetting('autoStartOnBoot', val)
            }
            trackColor={{false: '#404050', true: '#4CAF5060'}}
            thumbColor={settings.autoStartOnBoot ? '#4CAF50' : '#808090'}
          />
        </View>
        <Text style={styles.hint}>
          Automatically start the server when the device boots
        </Text>
      </View>

      {/* ADB Instructions */}
      <Text style={styles.sectionTitle}>ADB Configuration</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>
          Run these commands via ADB to increase the OS SMS rate limit:
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code} selectable>
            adb shell settings put global sms_outgoing_check_max_count 2000
          </Text>
          <Text style={styles.code} selectable>
            adb shell settings put global sms_outgoing_check_interval_ms
            86400000
          </Text>
          <Text style={styles.code} selectable>
            adb shell dumpsys deviceidle whitelist +com.smsgateway
          </Text>
        </View>
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
        <Text style={styles.resetText}>Reset All Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2A2A3A',
    color: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  hint: {
    color: '#606070',
    fontSize: 11,
    marginTop: 4,
  },
  apiKeyRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#4CAF5025',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iconButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 13,
  },
  link: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webhookActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  testButton: {
    backgroundColor: '#2A2A3A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  testResult: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeBlock: {
    backgroundColor: '#0D0D18',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  code: {
    color: '#4CAF50',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#F4433620',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  resetText: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 14,
  },
});
