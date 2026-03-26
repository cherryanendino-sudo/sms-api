import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {SimCard} from '../types/api';

interface SimSelectorProps {
  sims: SimCard[];
  selectedSim: number | null;
  onSelect: (slotIndex: number | null) => void;
  autoRotate: boolean;
}

export const SimSelector: React.FC<SimSelectorProps> = ({
  sims,
  selectedSim,
  onSelect,
  autoRotate,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>SIM Selection</Text>
      <View style={styles.options}>
        <TouchableOpacity
          style={[
            styles.option,
            autoRotate && selectedSim === null && styles.optionActive,
          ]}
          onPress={() => onSelect(null)}>
          <Text
            style={[
              styles.optionText,
              autoRotate && selectedSim === null && styles.optionTextActive,
            ]}>
            Auto-Rotate
          </Text>
        </TouchableOpacity>

        {sims.map(sim => (
          <TouchableOpacity
            key={sim.slotIndex}
            style={[
              styles.option,
              selectedSim === sim.slotIndex && styles.optionActive,
              !sim.isActive && styles.optionDisabled,
            ]}
            onPress={() => sim.isActive && onSelect(sim.slotIndex)}
            disabled={!sim.isActive}>
            <Text
              style={[
                styles.optionText,
                selectedSim === sim.slotIndex && styles.optionTextActive,
                !sim.isActive && styles.optionTextDisabled,
              ]}>
              SIM {sim.slotIndex}
            </Text>
            <Text style={styles.carrier}>{sim.carrierName}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#2A2A3A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5015',
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#4CAF50',
  },
  optionTextDisabled: {
    color: '#606070',
  },
  carrier: {
    color: '#808090',
    fontSize: 11,
    marginTop: 2,
  },
});
