import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
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
  const statusColor = getStatusColor(doc.status);
  const hasDraftActions = doc.status === 'draft' && (onEdit || onDelete || onSubmit);
  const hasSubmittedActions = doc.status === 'submitted' && (onApprove || onApproveWithComment || onReject);

  return (
    <Card style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.topRow}>
          <Text style={styles.documentNumber}>{doc.documentNumber}</Text>
          <View style={styles.topRowChips}>
            {doc.weightage !== undefined && doc.weightage !== null && (
              <Chip
                mode="flat"
                style={styles.weightageChip}
                textStyle={styles.weightageText}
                compact
              >
                {doc.weightage}%
              </Chip>
            )}
            <Chip
              mode="flat"
              style={{ backgroundColor: statusColor }}
              textStyle={styles.statusChipText}
              compact
            >
              {getStatusLabel(doc.status)}
            </Chip>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>{doc.title}</Text>

        <View style={styles.metaRow}>
          <Chip
            mode="flat"
            style={{ backgroundColor: getDocumentTypeColor(doc.documentType) }}
            textStyle={styles.typeChipText}
            compact
          >
            {getDocumentTypeLabel(doc.documentType)}
          </Chip>
          {doc.categoryName && (
            <Text style={styles.metaText}>{doc.categoryName}</Text>
          )}
          {doc.siteName && (
            <Text style={styles.metaText}>{doc.siteName}</Text>
          )}
          {(doc as any).keyDateId && (
            <Chip
              mode="outlined"
              icon="calendar-check"
              style={styles.keyDateChip}
              textStyle={styles.keyDateText}
              compact
            >
              Key Date
            </Chip>
          )}
          <Text style={styles.metaText}>{doc.revisionNumber}</Text>
        </View>

        {doc.description ? (
          <Text style={styles.description} numberOfLines={2}>{doc.description}</Text>
        ) : null}

        {(doc.submittedDate || doc.approvedDate || doc.approvalComment) && (
          <View style={styles.detailsSection}>
            {doc.submittedDate && (
              <Text style={styles.detailText}>
                Submitted: {new Date(doc.submittedDate).toLocaleDateString()}
              </Text>
            )}
            {doc.approvedDate && (
              <Text style={styles.detailText}>
                Approved: {new Date(doc.approvedDate).toLocaleDateString()}
              </Text>
            )}
            {doc.approvalComment && (
              <Text style={styles.detailText}>
                Comment: {doc.approvalComment}
              </Text>
            )}
          </View>
        )}

        {(hasDraftActions || hasSubmittedActions) && (
          <View style={styles.actionButtons}>
            {doc.status === 'draft' && onSubmit && (
              <Button
                mode="contained"
                icon="send"
                onPress={() => onSubmit(doc.id)}
                compact
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                labelStyle={styles.actionButtonLabel}
              >
                Submit
              </Button>
            )}
            {doc.status === 'draft' && onEdit && (
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => onEdit(doc)}
                compact
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              >
                Edit
              </Button>
            )}
            {doc.status === 'draft' && onDelete && (
              <Button
                mode="outlined"
                icon="delete"
                onPress={() => onDelete(doc.id)}
                compact
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
                textColor="#F44336"
              >
                Delete
              </Button>
            )}
            {doc.status === 'submitted' && onApprove && (
              <Button
                mode="contained"
                icon="check"
                onPress={() => onApprove(doc.id)}
                compact
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                labelStyle={styles.actionButtonLabel}
              >
                Approve
              </Button>
            )}
            {doc.status === 'submitted' && onApproveWithComment && (
              <Button
                mode="outlined"
                icon="comment-check"
                onPress={() => onApproveWithComment(doc.id)}
                compact
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
                textColor="#FF9800"
              >
                Approve w/ Comment
              </Button>
            )}
            {doc.status === 'submitted' && onReject && (
              <Button
                mode="outlined"
                icon="close"
                onPress={() => onReject(doc.id)}
                compact
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
                textColor="#F44336"
              >
                Reject
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topRowChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeChipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  weightageChip: {
    backgroundColor: '#E3F2FD',
  },
  weightageText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  keyDateChip: {
    borderColor: '#673AB7',
  },
  keyDateText: {
    color: '#673AB7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    borderRadius: 6,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
});

export default DesignDocumentCard;
