/**
 * PhaseSelector - Dropdown component for selecting project phase
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Menu, Button } from 'react-native-paper';
import { ProjectPhase } from '../../../models/ItemModel';
import { COLORS } from '../../theme/colors';

interface PhaseOption {
  value: ProjectPhase;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const PHASE_OPTIONS: PhaseOption[] = [
  {
    value: 'design',
    label: 'Design & Engineering',
    icon: '✏️',
    color: COLORS.INFO,
    description: 'Design drawings, calculations, and specifications',
  },
  {
    value: 'approvals',
    label: 'Statutory Approvals',
    icon: '📋',
    color: COLORS.STATUS_EVALUATED,
    description: 'Regulatory and utility clearances',
  },
  {
    value: 'mobilization',
    label: 'Mobilization',
    icon: '🚛',
    color: '#FF5722',
    description: 'Resource deployment and site setup',
  },
  {
    value: 'procurement',
    label: 'Procurement',
    icon: '🛒',
    color: COLORS.WARNING,
    description: 'Equipment and material procurement',
  },
  {
    value: 'interface',
    label: 'Interface Coordination',
    icon: '🔗',
    color: '#00BCD4',
    description: 'Coordination between contractors',
  },
  {
    value: 'site_prep',
    label: 'Site Preparation',
    icon: '🏗️',
    color: '#795548',
    description: 'Civil works and site readiness',
  },
  {
    value: 'construction',
    label: 'Construction',
    icon: '🔨',
    color: COLORS.SUCCESS,
    description: 'Main installation and construction work',
  },
  {
    value: 'testing',
    label: 'Testing & Pre-commissioning',
    icon: '🧪',
    color: COLORS.ERROR,
    description: 'Testing and quality checks',
  },
  {
    value: 'commissioning',
    label: 'Commissioning',
    icon: '⚡',
    color: '#3F51B5',
    description: 'System commissioning and energization',
  },
  {
    value: 'sat',
    label: 'Site Acceptance Test',
    icon: '✅',
    color: '#009688',
    description: 'Final acceptance testing',
  },
  {
    value: 'handover',
    label: 'Handover & Documentation',
    icon: '📦',
    color: COLORS.STATUS_CLOSED,
    description: 'Project closure and documentation',
  },
];

interface PhaseSelectorProps {
  value: ProjectPhase;
  onSelect: (phase: ProjectPhase) => void;
  disabled?: boolean;
}

const PhaseSelector: React.FC<PhaseSelectorProps> = ({ value, onSelect, disabled = false }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseOption | null>(null);

  useEffect(() => {
    // Find and set selected phase when value changes
    const phase = PHASE_OPTIONS.find(p => p.value === value);
    setSelectedPhase(phase || PHASE_OPTIONS[0]); // Default to 'design'
  }, [value]);

  const handleSelectPhase = (phase: PhaseOption) => {
    setSelectedPhase(phase);
    onSelect(phase.value);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => !disabled && setMenuVisible(true)}
            icon="chevron-down"
            contentStyle={styles.buttonContent}
            style={styles.button}
            disabled={disabled}
          >
            {selectedPhase?.icon} {selectedPhase?.label || 'Select Phase *'}
          </Button>
        }
      >
        <ScrollView style={styles.menuScroll}>
          {PHASE_OPTIONS.map((phase) => (
            <Menu.Item
              key={phase.value}
              onPress={() => handleSelectPhase(phase)}
              title={`${phase.icon} ${phase.label}`}
              titleStyle={[
                selectedPhase?.value === phase.value
                  ? styles.selectedMenuItem
                  : null,
                { color: phase.color },
              ]}
              leadingIcon={
                selectedPhase?.value === phase.value ? 'check' : undefined
              }
            />
          ))}
        </ScrollView>
      </Menu>

      {selectedPhase && selectedPhase.description && (
        <View style={[styles.descriptionBox, { borderLeftColor: selectedPhase.color }]}>
          <Text variant="bodySmall" style={styles.description}>
            {selectedPhase.description}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  button: {
    justifyContent: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  menuScroll: {
    maxHeight: 400,
  },
  selectedMenuItem: {
    fontWeight: 'bold',
  },
  descriptionBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderRadius: 4,
  },
  description: {
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PhaseSelector;
