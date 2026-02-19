import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { VendorQuote } from '../types/VendorQuoteTypes';
import { COLORS } from '../../theme/colors';

interface EvaluateQuoteDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    quoteId: string;
    technicalScore: number;
    commercialScore: number;
    technicalDeviations?: string;
    commercialDeviations?: string;
  }) => void;
  quote: VendorQuote | null;
}

const ScoreBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <View style={styles.scoreBarBg}>
    <View style={[styles.scoreBarFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
  </View>
);

const EvaluateQuoteDialog: React.FC<EvaluateQuoteDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  quote,
}) => {
  const [technicalScore, setTechnicalScore] = useState('70');
  const [techDeviations, setTechDeviations] = useState('');
  const [commDeviations, setCommDeviations] = useState('');

  useEffect(() => {
    if (visible && quote) {
      setTechnicalScore(String(quote.technicalScore || 70));
      setTechDeviations('');
      setCommDeviations('');
    }
  }, [visible, quote]);

  const techVal = parseInt(technicalScore) || 0;
  const isQualified = techVal >= 70;

  const handleSubmit = () => {
    if (!quote) return;
    if (techVal < 0 || techVal > 100) return;
    onSubmit({
      quoteId: quote.id,
      technicalScore: techVal,
      commercialScore: 0,
      technicalDeviations: techDeviations || undefined,
      commercialDeviations: commDeviations || undefined,
    });
  };

  if (!quote) return null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Evaluate Quote</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              <Text style={styles.vendorName}>{quote.vendorName}</Text>
              <Text style={styles.quotePrice}>
                {quote.currency} {quote.quotedPrice.toLocaleString('en-IN')}
              </Text>

              <View style={styles.scoreSection}>
                <View style={styles.scoreLabelRow}>
                  <Text style={styles.scoreLabel}>Technical Score</Text>
                  <TextInput
                    value={technicalScore}
                    onChangeText={setTechnicalScore}
                    style={styles.scoreInput}
                    mode="outlined"
                    keyboardType="numeric"
                    dense
                  />
                </View>
                <ScoreBar value={techVal} color={isQualified ? COLORS.INFO : COLORS.ERROR} />
              </View>

              <View style={[styles.qualificationBox, { backgroundColor: isQualified ? COLORS.SUCCESS_BG : COLORS.ERROR_BG }]}>
                <Text style={[styles.qualificationLabel, { color: isQualified ? '#2E7D32' : '#C62828' }]}>
                  {isQualified ? 'Qualified' : 'Below Threshold'}
                </Text>
                <Text style={[styles.qualificationHint, { color: isQualified ? '#388E3C' : '#D32F2F' }]}>
                  {isQualified ? `Score >= 70 — eligible for L1 ranking` : `Score < 70 — will not be ranked`}
                </Text>
              </View>

              <TextInput
                label="Technical Deviations"
                value={techDeviations}
                onChangeText={setTechDeviations}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
                placeholder="List technical deviations..."
              />

              <TextInput
                label="Commercial Deviations"
                value={commDeviations}
                onChangeText={setCommDeviations}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
                placeholder="List commercial deviations..."
              />
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSubmit}>Submit Evaluation</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quotePrice: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 16,
  },
  scoreSection: {
    marginBottom: 16,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  scoreInput: {
    width: 60,
    height: 36,
    textAlign: 'center',
  },
  scoreBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualificationBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  qualificationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qualificationHint: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    marginBottom: 12,
  },
});

export default EvaluateQuoteDialog;
