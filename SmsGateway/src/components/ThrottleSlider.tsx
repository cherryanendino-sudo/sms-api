import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ThrottleSliderProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  onValueChange: (value: number) => void;
}

/**
 * A simple step-based selector for throttle delay and daily limits.
 * Uses touchable buttons instead of a slider for reliability across devices.
 */
export const ThrottleSlider: React.FC<ThrottleSliderProps> = ({
  value,
  min,
  max,
  label,
  unit,
  onValueChange,
}) => {
  const increment = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  const bigIncrement = () => {
    const next = Math.min(value + 10, max);
    onValueChange(next);
  };

  const bigDecrement = () => {
    const next = Math.max(value - 10, min);
    onValueChange(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Text style={styles.button} onPress={bigDecrement}>
          --
        </Text>
        <Text style={styles.button} onPress={decrement}>
          -
        </Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
        <Text style={styles.button} onPress={increment}>
          +
        </Text>
        <Text style={styles.button} onPress={bigIncrement}>
          ++
        </Text>
      </View>
      <View style={styles.range}>
        <Text style={styles.rangeText}>
          {min} {unit}
        </Text>
        <Text style={styles.rangeText}>
          {max} {unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#2A2A3A',
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  unit: {
    color: '#808090',
    fontSize: 11,
    marginTop: 2,
  },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeText: {
    color: '#606070',
    fontSize: 10,
  },
});
