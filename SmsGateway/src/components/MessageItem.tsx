import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {Message} from '../types/message';
import {formatDateTime, maskPhoneNumber, truncateText} from '../utils/formatters';

interface MessageItemProps {
  message: Message;
  onRetry?: (id: string) => void;
  onPress?: (message: Message) => void;
}

const STATUS_COLORS: Record<string, string> = {
  QUEUED: '#FFC107',
  SENDING: '#2196F3',
  SENT: '#03A9F4',
  DELIVERED: '#4CAF50',
  FAILED: '#F44336',
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
  onPress,
}) => {
  const statusColor = STATUS_COLORS[message.status] ?? '#808080';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(message)}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.phone}>
          {maskPhoneNumber(message.phoneNumber)}
        </Text>
        <View style={[styles.badge, {backgroundColor: statusColor}]}>
          <Text style={styles.badgeText}>{message.status}</Text>
        </View>
      </View>

      <Text style={styles.messageText} numberOfLines={2}>
        {truncateText(message.messageText, 80)}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {formatDateTime(message.createdAt)}
        </Text>
        {message.usedSimSlot != null && (
          <Text style={styles.simLabel}>SIM {message.usedSimSlot}</Text>
        )}
        {message.status === 'FAILED' && onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => onRetry(message.id)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {message.retryCount > 0 && (
        <Text style={styles.retryCount}>
          Retries: {message.retryCount}/{message.maxRetries}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phone: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  messageText: {
    color: '#A0A0B0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timestamp: {
    color: '#606070',
    fontSize: 11,
  },
  simLabel: {
    color: '#808090',
    fontSize: 11,
    backgroundColor: '#2A2A3A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retryButton: {
    marginLeft: 'auto',
    backgroundColor: '#F4433620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  retryCount: {
    color: '#808090',
    fontSize: 10,
    marginTop: 4,
  },
});
