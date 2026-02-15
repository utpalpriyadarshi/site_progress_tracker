import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { VendorQuote } from '../types/VendorQuoteTypes';

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
  const [commercialScore, setCommercialScore] = useState('70');
  const [techDeviations, setTechDeviations] = useState('');
  const [commDeviations, setCommDeviations] = useState('');

  useEffect(() => {
    if (visible && quote) {
      setTechnicalScore(String(quote.technicalScore || 70));
      setCommercialScore(String(quote.commercialScore || 70));
      setTechDeviations('');
      setCommDeviations('');
    }
  }, [visible, quote]);

  const techVal = parseInt(technicalScore) || 0;
  const commVal = parseInt(commercialScore) || 0;
  const overallScore = (techVal * 60 + commVal * 40) / 100;

  const handleSubmit = () => {
    if (!quote) return;
    if (techVal < 0 || techVal > 100 || commVal < 0 || commVal > 100) return;
    onSubmit({
      quoteId: quote.id,
      technicalScore: techVal,
      commercialScore: commVal,
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
                  <Text style={styles.scoreLabel}>Technical Score (60% weight)</Text>
                  <TextInput
                    value={technicalScore}
                    onChangeText={setTechnicalScore}
                    style={styles.scoreInput}
                    mode="outlined"
                    keyboardType="numeric"
                    dense
                  />
                </View>
                <ScoreBar value={techVal} color="#2196F3" />
              </View>

              <View style={styles.scoreSection}>
                <View style={styles.scoreLabelRow}>
                  <Text style={styles.scoreLabel}>Commercial Score (40% weight)</Text>
                  <TextInput
                    value={commercialScore}
                    onChangeText={setCommercialScore}
                    style={styles.scoreInput}
                    mode="outlined"
                    keyboardType="numeric"
                    dense
                  />
                </View>
                <ScoreBar value={commVal} color="#FF9800" />
              </View>

              <View style={styles.overallScoreBox}>
                <Text style={styles.overallLabel}>Overall Score</Text>
                <Text style={styles.overallValue}>{overallScore.toFixed(1)}</Text>
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
  overallScoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  overallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
  },
  overallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  input: {
    marginBottom: 12,
  },
});

export default EvaluateQuoteDialog;
