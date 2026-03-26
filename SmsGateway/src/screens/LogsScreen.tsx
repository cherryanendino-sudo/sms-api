import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {DatabaseBridge} from '../native/DatabaseBridge';
import {formatTime} from '../utils/formatters';

interface LogEntry {
  id: number;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  messageId: string | null;
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: '#4CAF50',
  WARN: '#FFC107',
  ERROR: '#F44336',
};

type LogFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

export const LogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // In a real implementation, logs would come from a dedicated native module.
  // For now we generate placeholder entries from message activity.
  const loadLogs = useCallback(async () => {
    try {
      const messages = await DatabaseBridge.getMessages(undefined, 100, 0);
      const entries: LogEntry[] = messages.map((msg, i) => ({
        id: i,
        timestamp: msg.createdAt,
        level:
          msg.status === 'FAILED'
            ? 'ERROR'
            : msg.status === 'QUEUED'
              ? 'INFO'
              : 'INFO',
        message: `[${msg.status}] ${msg.phoneNumber} - ${msg.messageText.slice(0, 40)}`,
        messageId: msg.id,
      }));
      setLogs(entries);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, [loadLogs]);

  const filteredLogs =
    filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  const renderItem = ({item}: {item: LogEntry}) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={[styles.level, {color: LEVEL_COLORS[item.level]}]}>
          {item.level}
        </Text>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No log entries</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {(['ALL', 'INFO', 'WARN', 'ERROR'] as LogFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{flex: 1}} />
        <Text style={styles.count}>{filteredLogs.length} entries</Text>
      </View>

      {/* Log List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        contentContainerStyle={
          filteredLogs.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A3A',
  },
  filterTabActive: {
    backgroundColor: '#4CAF5025',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  filterText: {
    color: '#808090',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#4CAF50',
  },
  count: {
    color: '#606070',
    fontSize: 11,
  },
  logItem: {
    backgroundColor: '#1E1E2E',
    marginVertical: 2,
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  level: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timestamp: {
    color: '#606070',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logMessage: {
    color: '#C0C0D0',
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    color: '#808090',
    fontSize: 16,
    fontWeight: '600',
  },
});
