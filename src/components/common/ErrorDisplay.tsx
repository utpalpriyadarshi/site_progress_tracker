import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../theme/colors';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container} accessible accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={48} color={COLORS.ERROR} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button mode="outlined" onPress={onRetry} style={styles.button}>
          Try Again
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  message: {
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },
  button: {
    marginTop: 4,
  },
});
