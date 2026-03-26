import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  color = '#4CAF50',
}) => {
  return (
    <View style={[styles.card, {borderLeftColor: color}]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, {color}]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    flex: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#808090',
    marginTop: 4,
  },
});
