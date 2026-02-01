import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, IconButton } from 'react-native-paper';
import {
  DesignDocument,
  getStatusColor,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  getStatusLabel,
} from '../types/DesignDocumentTypes';

interface DesignDocumentCardProps {
  document: DesignDocument;
  onEdit?: (doc: DesignDocument) => void;
  onDelete?: (docId: string) => void;
  onSubmit?: (docId: string) => void;
  onApprove?: (docId: string) => void;
  onApproveWithComment?: (docId: string) => void;
  onReject?: (docId: string) => void;
}

const DesignDocumentCard: React.FC<DesignDocumentCardProps> = ({
  document: doc,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onApproveWithComment,
  onReject,
}) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.documentNumber}>{doc.documentNumber}</Text>
            <Text style={styles.title} numberOfLines={2}>{doc.title}</Text>
          </View>
          <View style={styles.badges}>
            <Chip
              mode="flat"
              style={{ backgroundColor: getDocumentTypeColor(doc.documentType) }}
              textStyle={styles.chipText}
            >
              {getDocumentTypeLabel(doc.documentType)}
            </Chip>
            <Chip
              mode="flat"
              style={{ backgroundColor: getStatusColor(doc.status) }}
              textStyle={styles.chipText}
            >
              {getStatusLabel(doc.status)}
            </Chip>
          </View>
        </View>

        {doc.categoryName && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{doc.categoryName}</Text>
          </View>
        )}

        {doc.siteName && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Site:</Text>
            <Text style={styles.value}>{doc.siteName}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Revision:</Text>
          <Text style={styles.value}>{doc.revisionNumber}</Text>
        </View>

        {doc.description ? (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value} numberOfLines={2}>{doc.description}</Text>
          </View>
        ) : null}

        {doc.submittedDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Submitted:</Text>
            <Text style={styles.value}>{new Date(doc.submittedDate).toLocaleDateString()}</Text>
          </View>
        )}

        {doc.approvedDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Approved:</Text>
            <Text style={styles.value}>{new Date(doc.approvedDate).toLocaleDateString()}</Text>
          </View>
        )}

        {doc.approvalComment && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Comment:</Text>
            <Text style={styles.value}>{doc.approvalComment}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {doc.status === 'draft' && onEdit && (
            <IconButton icon="pencil" size={20} onPress={() => onEdit(doc)} />
          )}
          {doc.status === 'draft' && onDelete && (
            <IconButton icon="delete" size={20} onPress={() => onDelete(doc.id)} />
          )}
          {doc.status === 'draft' && onSubmit && (
            <IconButton icon="send" size={20} onPress={() => onSubmit(doc.id)} />
          )}
          {doc.status === 'submitted' && onApprove && (
            <IconButton icon="check" size={20} onPress={() => onApprove(doc.id)} />
          )}
          {doc.status === 'submitted' && onApproveWithComment && (
            <IconButton icon="comment-check" size={20} onPress={() => onApproveWithComment(doc.id)} />
          )}
          {doc.status === 'submitted' && onReject && (
            <IconButton icon="close" size={20} onPress={() => onReject(doc.id)} />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  documentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  title: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  badges: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  chipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default DesignDocumentCard;
