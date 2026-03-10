/**
 * Step1UploadFile - File upload interface
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { formatFileSize } from '../../../utils/BomFileParser';
import { FILE_INFO } from '../utils/wizardConstants';
import { COLORS } from '../../../theme/colors';

interface Step1UploadFileProps {
  fileName: string;
  fileSize: number;
  rowCount: number;
  onFilePicker: () => void;
}

export const Step1UploadFile: React.FC<Step1UploadFileProps> = ({
  fileName,
  fileSize,
  rowCount,
  onFilePicker,
}) => {
  return (
    <Card mode="elevated" style={styles.contentCard}>
      <Card.Content>
        <Title style={styles.contentTitle}>Step 1: Upload File</Title>
        <Paragraph style={styles.contentSubtitle}>
          Select an Excel (.xlsx, .xls) or CSV file containing your BOM data
        </Paragraph>

        {!fileName ? (
          <View style={styles.uploadContainer}>
            <View style={styles.dropZone}>
              <Paragraph style={styles.dropZoneText}>📁 Select your BOM file</Paragraph>
              <Button mode="contained" onPress={onFilePicker} style={styles.browseButton}>
                Browse Files
              </Button>
            </View>

            <View style={styles.infoBox}>
              <Paragraph style={styles.infoTitle}>Supported Formats:</Paragraph>
              {FILE_INFO.formats.map((format, index) => (
                <Paragraph key={index} style={styles.infoText}>
                  • {format}
                </Paragraph>
              ))}
              <Paragraph style={styles.infoText}>• Maximum file size: {FILE_INFO.maxSize}</Paragraph>
            </View>
          </View>
        ) : (
          <View style={styles.fileInfoContainer}>
            <Chip icon="check-circle" style={styles.successChip}>
              File Uploaded
            </Chip>
            <View style={styles.fileDetails}>
              <Paragraph style={styles.fileDetailLabel}>File Name:</Paragraph>
              <Paragraph style={styles.fileDetailValue}>{fileName}</Paragraph>
            </View>
            <View style={styles.fileDetails}>
              <Paragraph style={styles.fileDetailLabel}>File Size:</Paragraph>
              <Paragraph style={styles.fileDetailValue}>{formatFileSize(fileSize)}</Paragraph>
            </View>
            <View style={styles.fileDetails}>
              <Paragraph style={styles.fileDetailLabel}>Rows Found:</Paragraph>
              <Paragraph style={styles.fileDetailValue}>{rowCount}</Paragraph>
            </View>
            <Button mode="outlined" onPress={onFilePicker} style={styles.changeFileButton}>
              Change File
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    margin: 15,
    marginTop: 10,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  uploadContainer: {
    marginTop: 10,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.INFO,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    backgroundColor: COLORS.INFO_BG,
  },
  dropZoneText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  browseButton: {
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: COLORS.WARNING_BG,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  fileInfoContainer: {
    padding: 15,
    backgroundColor: COLORS.SUCCESS_BG,
    borderRadius: 8,
  },
  successChip: {
    backgroundColor: COLORS.SUCCESS,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  fileDetails: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  fileDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
    width: 100,
  },
  fileDetailValue: {
    fontSize: 14,
    color: '#666',
  },
  changeFileButton: {
    marginTop: 15,
  },
});
