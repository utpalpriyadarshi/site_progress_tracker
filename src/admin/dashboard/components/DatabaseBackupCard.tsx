/**
 * DatabaseBackupCard Component
 *
 * Admin dashboard card for backing up and restoring the local database.
 * Exports all collections to a JSON file in Downloads, and restores
 * from available backups in the Downloads folder.
 *
 * @version 1.0.0
 * @since v2.12 - Database Backup/Restore
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import DatabaseBackupService from '../../../services/DatabaseBackupService';
import { COLORS } from '../../../theme/colors';

export const DatabaseBackupCard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const result = await DatabaseBackupService.exportBackup();
      if (result.success && result.filePath) {
        setLastBackupPath(result.filePath);
        Alert.alert(
          'Backup Complete',
          `${result.recordCount} records saved.\n\nFile: ${result.filePath}`,
          [
            { text: 'OK' },
            {
              text: 'Share',
              onPress: () => DatabaseBackupService.shareBackup(result.filePath!),
            },
          ]
        );
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Backup Failed', String(error));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    try {
      const backups = await DatabaseBackupService.listBackups();

      if (backups.length === 0) {
        Alert.alert(
          'No Backups Found',
          'No backup files found in the Downloads folder.\n\nCreate a backup first using the Backup button.'
        );
        return;
      }

      // Show the most recent backups to choose from
      const options = backups.slice(0, 5).map((path) => ({
        text: path.split('/').pop() || path,
        onPress: () => confirmRestore(path),
      }));

      options.push({ text: 'Cancel', onPress: () => {} });

      Alert.alert(
        'Select Backup to Restore',
        `Found ${backups.length} backup(s). Select one:`,
        options
      );
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const confirmRestore = (filePath: string) => {
    const fileName = filePath.split('/').pop();
    Alert.alert(
      'Restore Database',
      `This will REPLACE all current data with:\n\n${fileName}\n\nAre you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await DatabaseBackupService.restoreFromFile(filePath);
              if (result.success) {
                Alert.alert(
                  'Restore Complete',
                  `${result.recordCount} records restored.\n\nPlease restart the app for changes to take full effect.`
                );
              } else {
                Alert.alert('Restore Failed', result.error || 'Unknown error');
              }
            } catch (error) {
              Alert.alert('Restore Failed', String(error));
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <Title>Database Backup & Restore</Title>
        <Paragraph style={styles.description}>
          Export all data to a JSON file or restore from a previous backup.
          Back up before clearing app data or updating the app.
        </Paragraph>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            icon="database-export"
            onPress={handleBackup}
            disabled={isExporting || isRestoring}
            style={[styles.button, styles.backupButton]}
            loading={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Backup'}
          </Button>

          <Button
            mode="outlined"
            icon="database-import"
            onPress={handleRestore}
            disabled={isExporting || isRestoring}
            style={styles.button}
            loading={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </Button>
        </View>

        {lastBackupPath && (
          <Text style={styles.lastBackup} numberOfLines={2}>
            Last backup: {lastBackupPath.split('/').pop()}
          </Text>
        )}

        <Paragraph style={styles.hint}>
          Backups are saved to your Downloads folder.
        </Paragraph>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginBottom: 10,
    backgroundColor: COLORS.INFO_BG,
  },
  description: {
    marginTop: 5,
    marginBottom: 15,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  backupButton: {
    backgroundColor: '#1976D2',
  },
  lastBackup: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 10,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
