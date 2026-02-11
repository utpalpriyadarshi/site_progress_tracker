/**
 * DesignDocumentCopyService.ts
 *
 * Service for copying design documents between sites
 * Similar to ItemCopyService pattern
 *
 * Features:
 * - Duplicate detection based on document numbers
 * - Batch copy with transaction safety
 * - Status reset to draft for copied documents
 * - Revision number preservation
 *
 * @version 1.0
 */

import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from './LoggingService';

// ==================== Types ====================

export interface CopyDocumentsOptions {
  /** Source site ID to copy from */
  sourceSiteId: string;

  /** Destination site ID to copy to */
  destinationSiteId: string;

  /** Whether to skip documents with duplicate document numbers */
  skipDuplicates: boolean;

  /** Array of document numbers to treat as duplicates (for selective copying) */
  duplicateNumbers: string[];
}

export interface CopyDocumentsResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Number of documents successfully copied */
  documentsCopied: number;

  /** Number of documents skipped due to duplicates */
  documentsSkipped: number;

  /** Any errors encountered */
  errors?: string[];
}

// ==================== Helpers ====================

/**
 * Count design documents in a site
 */
export const countSiteDocuments = async (siteId: string): Promise<number> => {
  try {
    const count = await database.collections
      .get('design_documents')
      .query(Q.where('site_id', siteId))
      .fetchCount();

    logger.debug('Site document count fetched', {
      service: 'DesignDocumentCopyService',
      siteId,
      count,
    });

    return count;
  } catch (error) {
    logger.error('Failed to count site documents', error as Error, {
      service: 'DesignDocumentCopyService',
      siteId,
    });
    return 0;
  }
};

/**
 * Detect duplicate document numbers between source and destination sites
 *
 * Returns array of document numbers that exist in both sites
 */
export const detectDuplicates = async (
  sourceSiteId: string,
  destinationSiteId: string
): Promise<string[]> => {
  try {
    logger.debug('Detecting duplicate documents', {
      service: 'DesignDocumentCopyService',
      sourceSiteId,
      destinationSiteId,
    });

    // Get source documents
    const sourceDocuments = await database.collections
      .get('design_documents')
      .query(Q.where('site_id', sourceSiteId))
      .fetch();

    // Get destination document numbers
    const destinationDocuments = await database.collections
      .get('design_documents')
      .query(Q.where('site_id', destinationSiteId))
      .fetch();

    const destinationNumbers = new Set(
      destinationDocuments.map((doc: any) => doc.documentNumber)
    );

    // Find duplicates
    const duplicates = sourceDocuments
      .filter((doc: any) => destinationNumbers.has(doc.documentNumber))
      .map((doc: any) => doc.documentNumber);

    logger.debug('Duplicate detection complete', {
      service: 'DesignDocumentCopyService',
      duplicateCount: duplicates.length,
      duplicates,
    });

    return duplicates;
  } catch (error) {
    logger.error('Failed to detect duplicates', error as Error, {
      service: 'DesignDocumentCopyService',
      sourceSiteId,
      destinationSiteId,
    });
    return [];
  }
};

/**
 * Copy design documents from source site to destination site
 *
 * Features:
 * - Batch copy with transaction safety
 * - Duplicate handling (skip or overwrite)
 * - Status reset to draft
 * - Approval fields cleared
 * - New IDs and timestamps
 */
export const copyDocuments = async (
  options: CopyDocumentsOptions
): Promise<CopyDocumentsResult> => {
  const { sourceSiteId, destinationSiteId, skipDuplicates, duplicateNumbers } = options;

  const result: CopyDocumentsResult = {
    success: false,
    documentsCopied: 0,
    documentsSkipped: 0,
    errors: [],
  };

  try {
    logger.info('Starting document copy operation', {
      service: 'DesignDocumentCopyService',
      ...options,
    });

    // 1. Fetch source documents
    const sourceDocuments = await database.collections
      .get('design_documents')
      .query(Q.where('site_id', sourceSiteId))
      .fetch();

    if (sourceDocuments.length === 0) {
      result.success = true;
      logger.info('No documents to copy', {
        service: 'DesignDocumentCopyService',
        sourceSiteId,
      });
      return result;
    }

    // 2. Copy documents in batch transaction
    await database.write(async () => {
      const docsCollection = database.collections.get('design_documents');

      for (const sourceDoc of sourceDocuments) {
        const docData = sourceDoc as any;
        const documentNumber = docData.documentNumber;

        // Skip duplicates if requested
        if (skipDuplicates && duplicateNumbers.includes(documentNumber)) {
          result.documentsSkipped++;
          logger.debug('Skipping duplicate document', {
            service: 'DesignDocumentCopyService',
            documentNumber,
          });
          continue;
        }

        try {
          // Create new document with reset fields
          await docsCollection.create((newDoc: any) => {
            // Copy basic fields
            newDoc.documentNumber = docData.documentNumber;
            newDoc.title = docData.title;
            newDoc.description = docData.description || null;
            newDoc.documentType = docData.documentType;
            newDoc.categoryId = docData.categoryId || null;
            newDoc.projectId = docData.projectId;
            newDoc.revisionNumber = docData.revisionNumber;

            // Set new site
            newDoc.siteId = destinationSiteId;

            // Reset status and approval fields
            newDoc.status = 'draft';
            newDoc.approvalComment = null;
            newDoc.submittedDate = null;
            newDoc.approvedDate = null;

            // Set new metadata
            newDoc.createdBy = docData.createdBy;
            newDoc.createdAt = Date.now();
            newDoc.updatedAt = Date.now();
            newDoc.appSyncStatus = 'pending';
            newDoc.version = 1;
          });

          result.documentsCopied++;

        } catch (error) {
          const errorMsg = `Failed to copy document ${documentNumber}: ${(error as Error).message}`;
          result.errors?.push(errorMsg);

          logger.error('Failed to copy individual document', error as Error, {
            service: 'DesignDocumentCopyService',
            documentNumber,
          });
        }
      }
    });

    // 3. Determine overall success
    result.success = result.errors ? result.errors.length === 0 : true;

    logger.info('Document copy operation complete', {
      service: 'DesignDocumentCopyService',
      ...result,
    });

    return result;

  } catch (error) {
    logger.error('Document copy operation failed', error as Error, {
      service: 'DesignDocumentCopyService',
      ...options,
    });

    result.success = false;
    result.errors?.push((error as Error).message);
    return result;
  }
};
