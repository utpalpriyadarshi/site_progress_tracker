import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, Button, Text, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useDesignEngineerContext } from '../context/DesignEngineerContext';
import { DOCUMENT_TEMPLATES, DOCUMENT_TYPE_PREFIXES, DocumentTemplate } from '../data/documentTemplates';
import { getDocumentTypeLabel } from '../types/DesignDocumentTypes';
import { logger } from '../../services/LoggingService';

interface Site {
  id: string;
  name: string;
}

interface GeneratedDoc {
  documentNumber: string;
  title: string;
  documentType: string;
  weightage: number;
  isDuplicate: boolean;
}

interface ApplyTemplateDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (createdCount: number, templateName: string) => void;
}

const ApplyTemplateDialog: React.FC<ApplyTemplateDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
}) => {
  const { projectId, engineerId } = useDesignEngineerContext();

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedSiteName, setSelectedSiteName] = useState('Select target site');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>(DOCUMENT_TEMPLATES[0]);
  const [templateMenuVisible, setTemplateMenuVisible] = useState(false);

  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load sites when dialog opens
  useEffect(() => {
    if (!visible || !projectId) return;

    const fetchSites = async () => {
      try {
        const sitesData = await database.collections
          .get('sites')
          .query(Q.where('project_id', projectId))
          .fetch();
        setSites(sitesData.map((s: any) => ({ id: s.id, name: s.name })));
      } catch (error) {
        logger.error('[ApplyTemplate] Error loading sites:', error as Error);
      }
    };

    fetchSites();
  }, [visible, projectId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!visible) {
      setSelectedSiteId('');
      setSelectedSiteName('Select target site');
      setGeneratedDocs([]);
      setSelectedTemplate(DOCUMENT_TEMPLATES[0]);
    }
  }, [visible]);

  // Generate preview when site or template changes
  useEffect(() => {
    if (!selectedSiteId || !selectedTemplate || !projectId) {
      setGeneratedDocs([]);
      return;
    }

    const generatePreview = async () => {
      setGenerating(true);
      try {
        // Fetch existing documents to determine next numbers and detect duplicates
        const existingDocs = await database.collections
          .get('design_documents')
          .query(Q.where('project_id', projectId))
          .fetch();

        const existingNumbers = new Set(
          existingDocs.map((d: any) => d.documentNumber)
        );

        // Count existing docs per type to continue numbering
        const typeCounts: Record<string, number> = {};
        existingDocs.forEach((d: any) => {
          typeCounts[d.documentType] = (typeCounts[d.documentType] || 0) + 1;
        });

        const docs: GeneratedDoc[] = selectedTemplate.documents.map((tmplDoc) => {
          const prefix = DOCUMENT_TYPE_PREFIXES[tmplDoc.documentType] || tmplDoc.documentType.substring(0, 3).toUpperCase();
          const nextNum = (typeCounts[tmplDoc.documentType] || 0) + 1;
          typeCounts[tmplDoc.documentType] = nextNum;
          const documentNumber = `DD-${prefix}-${String(nextNum).padStart(3, '0')}`;

          return {
            documentNumber,
            title: tmplDoc.title,
            documentType: tmplDoc.documentType,
            weightage: tmplDoc.weightage,
            isDuplicate: existingNumbers.has(documentNumber),
          };
        });

        setGeneratedDocs(docs);
      } catch (error) {
        logger.error('[ApplyTemplate] Error generating preview:', error as Error);
      } finally {
        setGenerating(false);
      }
    };

    generatePreview();
  }, [selectedSiteId, selectedTemplate, projectId]);

  const duplicateCount = useMemo(
    () => generatedDocs.filter((d) => d.isDuplicate).length,
    [generatedDocs]
  );

  const docsToCreate = useMemo(
    () => generatedDocs.filter((d) => !d.isDuplicate),
    [generatedDocs]
  );

  const canApply = selectedSiteId !== '' && docsToCreate.length > 0 && !loading;

  const handleApply = async () => {
    if (!canApply || !projectId || !engineerId) return;

    setLoading(true);
    try {
      // Look up categories to assign categoryId where possible
      const categories = await database.collections
        .get('design_document_categories')
        .query(Q.where('project_id', projectId))
        .fetch();

      const categoryMap: Record<string, string> = {};
      categories.forEach((cat: any) => {
        if (cat.documentType !== '_category') {
          // Sub-categories keyed by documentType
          if (!categoryMap[cat.documentType]) {
            categoryMap[cat.documentType] = cat.id;
          }
        }
      });

      const docsCollection = database.collections.get('design_documents');
      const now = Date.now();

      await database.write(async () => {
        for (const doc of docsToCreate) {
          await docsCollection.create((rec: any) => {
            rec.documentNumber = doc.documentNumber;
            rec.title = doc.title;
            rec.documentType = doc.documentType;
            rec.categoryId = categoryMap[doc.documentType] || null;
            rec.projectId = projectId;
            rec.siteId = selectedSiteId;
            rec.revisionNumber = 'R0';
            rec.weightage = doc.weightage;
            rec.status = 'draft';
            rec.createdBy = engineerId;
            rec.createdAt = now;
            rec.updatedAt = now;
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });
        }
      });

      logger.info('[ApplyTemplate] Template applied successfully', {
        template: selectedTemplate.name,
        siteId: selectedSiteId,
        createdCount: docsToCreate.length,
        skippedDuplicates: duplicateCount,
      });

      onSuccess(docsToCreate.length, selectedTemplate.name);
    } catch (error) {
      logger.error('[ApplyTemplate] Error applying template:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Apply Document Template</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView>
            {/* Template Selector */}
            <Text style={styles.label}>Template</Text>
            <Menu
              visible={templateMenuVisible}
              onDismiss={() => setTemplateMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setTemplateMenuVisible(true)}
                  style={styles.dropdownButton}
                  contentStyle={styles.dropdownContent}
                  icon="chevron-down"
                >
                  {selectedTemplate.name}
                </Button>
              }
            >
              {DOCUMENT_TEMPLATES.map((tmpl) => (
                <Menu.Item
                  key={tmpl.id}
                  onPress={() => {
                    setSelectedTemplate(tmpl);
                    setTemplateMenuVisible(false);
                  }}
                  title={tmpl.name}
                />
              ))}
            </Menu>
            <Text style={styles.description}>{selectedTemplate.description}</Text>

            <Divider style={styles.divider} />

            {/* Site Selector */}
            <Text style={styles.label}>Target Site</Text>
            <Menu
              visible={siteMenuVisible}
              onDismiss={() => setSiteMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSiteMenuVisible(true)}
                  style={styles.dropdownButton}
                  contentStyle={styles.dropdownContent}
                  icon="chevron-down"
                >
                  {selectedSiteName}
                </Button>
              }
            >
              {sites.map((site) => (
                <Menu.Item
                  key={site.id}
                  onPress={() => {
                    setSelectedSiteId(site.id);
                    setSelectedSiteName(site.name);
                    setSiteMenuVisible(false);
                  }}
                  title={site.name}
                />
              ))}
              {sites.length === 0 && (
                <Menu.Item title="No sites available" disabled />
              )}
            </Menu>

            {/* Preview */}
            {generating && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>Generating preview...</Text>
              </View>
            )}

            {generatedDocs.length > 0 && !generating && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.label}>
                  Documents to Create ({docsToCreate.length})
                </Text>

                {duplicateCount > 0 && (
                  <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>
                      {duplicateCount} document{duplicateCount !== 1 ? 's' : ''} will be skipped (document number already exists)
                    </Text>
                  </View>
                )}

                {generatedDocs.map((doc, index) => (
                  <View
                    key={index}
                    style={[
                      styles.previewItem,
                      doc.isDuplicate && styles.previewItemDuplicate,
                    ]}
                  >
                    <View style={styles.previewItemHeader}>
                      <Text
                        style={[
                          styles.previewDocNumber,
                          doc.isDuplicate && styles.duplicateText,
                        ]}
                      >
                        {doc.documentNumber}
                      </Text>
                      <Text style={styles.previewWeightage}>
                        {doc.weightage}%
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.previewTitle,
                        doc.isDuplicate && styles.duplicateText,
                      ]}
                    >
                      {doc.title}
                    </Text>
                    <Text style={styles.previewType}>
                      {getDocumentTypeLabel(doc.documentType as any)}
                      {doc.isDuplicate ? ' — DUPLICATE (will skip)' : ''}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            Cancel
          </Button>
          <Button
            onPress={handleApply}
            disabled={!canApply}
            loading={loading}
            mode="contained"
          >
            Create {docsToCreate.length} Document{docsToCreate.length !== 1 ? 's' : ''}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  dropdownButton: {
    marginHorizontal: 24,
  },
  dropdownContent: {
    justifyContent: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
  },
  previewItem: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewItemDuplicate: {
    opacity: 0.5,
  },
  previewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDocNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  previewWeightage: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  previewTitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  previewType: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  duplicateText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

export default ApplyTemplateDialog;
