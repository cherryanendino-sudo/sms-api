import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {StatusCard} from '../components/StatusCard';
import {useServerStore} from '../store/useServerStore';
import {useQueueStore} from '../store/useQueueStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {SmsBridge} from '../native/SmsBridge';
import {requestAllPermissions} from '../utils/permissions';
import {formatUptime} from '../utils/formatters';
import type {SimCard, SimStats} from '../types/api';

export const DashboardScreen: React.FC = () => {
  const server = useServerStore();
  const queue = useQueueStore();
  const settings = useSettingsStore();

  const [sims, setSims] = useState<SimCard[]>([]);
  const [simStats, setSimStats] = useState<SimStats[]>([]);

  const refreshData = useCallback(async () => {
    await server.refreshStatus();
    await queue.refreshStats();
    try {
      const cards = await SmsBridge.getSimCards();
      setSims(cards);
      const stats = await SmsBridge.getSimStats();
      setSimStats(stats);
    } catch {
      // SIM info may fail on first load before permissions
    }
  }, [server, queue]);

  useEffect(() => {
    settings.loadSettings();
    requestAllPermissions().then(granted => {
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'SMS and phone permissions are required for the gateway to function.',
        );
      }
    });
    refreshData();

    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleServer = async () => {
    if (server.running) {
      await server.stopServer();
      await queue.stopProcessing();
    } else {
      await server.startServer(settings.port, settings.apiKey);
      await queue.startProcessing();
    }
  };

  const totalToday = simStats.reduce((sum, s) => sum + s.sentToday, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Server Toggle */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          server.running ? styles.toggleActive : styles.toggleInactive,
        ]}
        onPress={handleToggleServer}
        disabled={server.loading}>
        <Text style={styles.toggleText}>
          {server.loading
            ? 'Starting...'
            : server.running
              ? 'Server Running'
              : 'Start Server'}
        </Text>
        {server.running && (
          <Text style={styles.toggleSub}>
            {server.ipAddress}:{server.port}
          </Text>
        )}
      </TouchableOpacity>

      {server.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{server.error}</Text>
          <Text style={styles.errorDismiss} onPress={server.clearError}>
            Dismiss
          </Text>
        </View>
      )}

      {/* Uptime */}
      {server.running && (
        <Text style={styles.uptime}>
          Uptime: {formatUptime(server.uptime)}
        </Text>
      )}

      {/* Stats Row */}
      <Text style={styles.sectionTitle}>Today's Activity</Text>
      <View style={styles.row}>
        <StatusCard
          title="Queued"
          value={String(queue.queued)}
          color="#FFC107"
        />
        <StatusCard
          title="Sent"
          value={String(queue.sent)}
          color="#03A9F4"
        />
      </View>
      <View style={styles.row}>
        <StatusCard
          title="Delivered"
          value={String(queue.delivered)}
          color="#4CAF50"
        />
        <StatusCard
          title="Failed"
          value={String(queue.failed)}
          color="#F44336"
        />
      </View>

      {/* SIM Cards */}
      <Text style={styles.sectionTitle}>SIM Status</Text>
      {sims.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No SIM cards detected</Text>
        </View>
      ) : (
        sims.map(sim => {
          const stats = simStats.find(s => s.slotIndex === sim.slotIndex);
          const sent = stats?.sentToday ?? 0;
          const limit = stats?.dailyLimit ?? settings.dailyLimitPerSim;
          const pct = limit > 0 ? (sent / limit) * 100 : 0;

          return (
            <View key={sim.slotIndex} style={styles.simCard}>
              <View style={styles.simHeader}>
                <Text style={styles.simTitle}>
                  SIM {sim.slotIndex} - {sim.carrierName}
                </Text>
                <View
                  style={[
                    styles.simStatus,
                    {backgroundColor: sim.isActive ? '#4CAF50' : '#F44336'},
                  ]}>
                  <Text style={styles.simStatusText}>
                    {sim.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              {sim.phoneNumber && (
                <Text style={styles.simPhone}>{sim.phoneNumber}</Text>
              )}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct > 90 ? '#F44336' : '#4CAF50',
                    },
                  ]}
                />
              </View>
              <Text style={styles.simCount}>
                {sent} / {limit} messages today
              </Text>
            </View>
          );
        })
      )}

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Sent Today</Text>
        <Text style={styles.totalValue}>{totalToday}</Text>
      </View>
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
    paddingBottom: 32,
  },
  toggleButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleActive: {
    backgroundColor: '#4CAF5025',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  toggleInactive: {
    backgroundColor: '#2A2A3A',
    borderWidth: 2,
    borderColor: '#404050',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#A0A0B0',
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  errorBanner: {
    backgroundColor: '#F4433620',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    flex: 1,
  },
  errorDismiss: {
    color: '#F44336',
    fontWeight: '700',
    marginLeft: 8,
  },
  uptime: {
    color: '#808090',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  simCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simTitle: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
  simStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  simStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  simPhone: {
    color: '#808090',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2A3A',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  simCount: {
    color: '#808090',
    fontSize: 11,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#606070',
    fontSize: 14,
  },
  totalCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  totalLabel: {
    color: '#A0A0B0',
    fontSize: 13,
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: '700',
  },
});
