import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, RadioButton, TextInput } from 'react-native-paper';
import { ChecklistSectionProps } from '../types';
import { ChecklistItem } from '../../../hooks/useChecklist';
import { COLORS } from '../../../theme/colors';

/**
 * Accordion left icon
 */
const AccordionLeftIcon = () => <List.Icon icon="clipboard-list" />;

/**
 * Accordion right icon showing pass count
 */
const AccordionRightIcon = React.memo<{ passCount: number; total: number }>(
  ({ passCount, total }) => (
    <Text style={styles.categoryCount}>
      {passCount}/{total}
    </Text>
  )
);

AccordionRightIcon.displayName = 'AccordionRightIcon';

/**
 * ChecklistSection component for displaying categorized safety checklist
 *
 * Features:
 * - Categorized accordion layout
 * - Radio buttons for pass/fail/n/a status
 * - Required notes field for failed items
 * - Category-level pass count summary
 * - Dynamic category grouping
 *
 * @param props - ChecklistSection props
 */
export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  checklistData,
  expandedCategories,
  onToggleCategory,
  onUpdateItem,
}) => {
  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(checklistData.map(item => item.category)));
  }, [checklistData]);

  // Calculate summary
  const summary = useMemo(() => {
    const pass = checklistData.filter(i => i.status === 'pass').length;
    const fail = checklistData.filter(i => i.status === 'fail').length;
    return { pass, fail };
  }, [checklistData]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Safety Checklist ({summary.pass} Pass / {summary.fail} Fail)
      </Text>

      {categories.map(category => {
        const categoryItems = checklistData.filter(item => item.category === category);
        const isExpanded = expandedCategories.includes(category);
        const passCount = categoryItems.filter(i => i.status === 'pass').length;

        const AccordionRightComponent = () => (
          <AccordionRightIcon passCount={passCount} total={categoryItems.length} />
        );

        return (
          <View key={category} style={styles.checklistCategory}>
            <List.Accordion
              title={category}
              expanded={isExpanded}
              onPress={() => onToggleCategory(category)}
              left={AccordionLeftIcon}
              right={AccordionRightComponent}
            >
              {categoryItems.map((item: ChecklistItem) => (
                <View key={item.id} style={styles.checklistItem}>
                  <Text style={styles.checklistItemText}>{item.item}</Text>

                  <View style={styles.statusButtons}>
                    <RadioButton.Group
                      onValueChange={value => onUpdateItem(item.id, 'status', value)}
                      value={item.status}
                    >
                      <View style={styles.radioRow}>
                        <View style={styles.radioItem}>
                          <RadioButton.Android value="pass" color={COLORS.SUCCESS} />
                          <Text style={styles.radioLabel}>Pass</Text>
                        </View>
                        <View style={styles.radioItem}>
                          <RadioButton.Android value="fail" color={COLORS.ERROR} />
                          <Text style={styles.radioLabel}>Fail</Text>
                        </View>
                        <View style={styles.radioItem}>
                          <RadioButton.Android value="na" color="#999" />
                          <Text style={styles.radioLabel}>N/A</Text>
                        </View>
                      </View>
                    </RadioButton.Group>
                  </View>

                  {item.status === 'fail' && (
                    <TextInput
                      label="Notes (required for failed items)"
                      value={item.notes}
                      onChangeText={value => onUpdateItem(item.id, 'notes', value)}
                      mode="outlined"
                      dense
                      multiline
                      style={styles.checklistNotes}
                    />
                  )}
                </View>
              ))}
            </List.Accordion>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  checklistCategory: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  checklistItem: {
    padding: 12,
    paddingLeft: 20,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checklistItemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  statusButtons: {
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: -4,
  },
  checklistNotes: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
});
