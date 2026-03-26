import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import {MessageItem} from '../components/MessageItem';
import {useQueueStore} from '../store/useQueueStore';
import type {Message, MessageStatus} from '../types/message';
import {formatDateTime} from '../utils/formatters';

const FILTERS: Array<{label: string; value: MessageStatus | null}> = [
  {label: 'All', value: null},
  {label: 'Queued', value: 'QUEUED'},
  {label: 'Sent', value: 'SENT'},
  {label: 'Delivered', value: 'DELIVERED'},
  {label: 'Failed', value: 'FAILED'},
];

export const QueueScreen: React.FC = () => {
  const queue = useQueueStore();
  const [activeFilter, setActiveFilter] = useState<MessageStatus | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    queue.loadMessages();
    queue.refreshStats();
  }, []);

  const handleFilterChange = (filter: MessageStatus | null) => {
    setActiveFilter(filter);
    queue.loadMessages(filter ?? undefined);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queue.loadMessages(activeFilter ?? undefined);
    await queue.refreshStats();
    setRefreshing(false);
  }, [activeFilter, queue]);

  const handleRetry = useCallback(
    (id: string) => {
      queue.retryMessage(id);
    },
    [queue],
  );

  const renderItem = ({item}: {item: Message}) => (
    <MessageItem
      message={item}
      onRetry={handleRetry}
      onPress={setSelectedMessage}
    />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No messages</Text>
      <Text style={styles.emptySubtext}>
        Messages will appear here when the server receives API requests
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, {color: '#FFC107'}]}>
            {queue.queued}
          </Text>
          <Text style={styles.statLabel}>Queued</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, {color: '#03A9F4'}]}>
            {queue.sent}
          </Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, {color: '#4CAF50'}]}>
            {queue.delivered}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, {color: '#F44336'}]}>
            {queue.failed}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[
              styles.filterTab,
              activeFilter === f.value && styles.filterTabActive,
            ]}
            onPress={() => handleFilterChange(f.value)}>
            <Text
              style={[
                styles.filterText,
                activeFilter === f.value && styles.filterTextActive,
              ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={queue.clearCompleted}>
          <Text style={styles.actionText}>Clear Completed</Text>
        </TouchableOpacity>
        <Text style={styles.messageCount}>
          {queue.messages.length} messages
        </Text>
      </View>

      {/* Message List */}
      <FlatList
        data={queue.messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
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
          queue.messages.length === 0 ? styles.emptyContainer : undefined
        }
      />

      {/* Message Detail Modal */}
      <Modal
        visible={selectedMessage !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMessage(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            {selectedMessage && (
              <>
                <Text style={styles.modalTitle}>Message Details</Text>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ID</Text>
                  <Text style={styles.modalValue} selectable>
                    {selectedMessage.id}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Phone</Text>
                  <Text style={styles.modalValue}>
                    {selectedMessage.phoneNumber}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <Text style={styles.modalValue}>
                    {selectedMessage.status}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Message</Text>
                  <Text style={styles.modalValue}>
                    {selectedMessage.messageText}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Created</Text>
                  <Text style={styles.modalValue}>
                    {formatDateTime(selectedMessage.createdAt)}
                  </Text>
                </View>

                {selectedMessage.sentAt && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Sent</Text>
                    <Text style={styles.modalValue}>
                      {formatDateTime(selectedMessage.sentAt)}
                    </Text>
                  </View>
                )}

                {selectedMessage.deliveredAt && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Delivered</Text>
                    <Text style={styles.modalValue}>
                      {formatDateTime(selectedMessage.deliveredAt)}
                    </Text>
                  </View>
                )}

                {selectedMessage.errorCode && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Error</Text>
                    <Text style={[styles.modalValue, {color: '#F44336'}]}>
                      {selectedMessage.errorCode}
                    </Text>
                  </View>
                )}

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Retries</Text>
                  <Text style={styles.modalValue}>
                    {selectedMessage.retryCount} / {selectedMessage.maxRetries}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedMessage(null)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#808090',
    fontSize: 10,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  actionButton: {
    backgroundColor: '#2A2A3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    color: '#A0A0B0',
    fontSize: 12,
  },
  messageCount: {
    color: '#606070',
    fontSize: 11,
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
  emptySubtext: {
    color: '#606070',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalRow: {
    marginBottom: 12,
  },
  modalLabel: {
    color: '#808090',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalValue: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  modalClose: {
    backgroundColor: '#2A2A3A',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
});
