import { useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import {
  DesignDocumentCategory,
  DOCUMENT_TYPES,
  DEFAULT_INSTALLATION_CATEGORIES,
  TOP_LEVEL_CATEGORY_TYPE,
} from '../types/DesignDocumentTypes';
import { DesignDocumentManagementAction } from '../state/design-document-management';

interface UseCategoryManagementParams {
  projectId: string;
  engineerId: string;
  dispatch: React.Dispatch<DesignDocumentManagementAction>;
  loadCategories: () => Promise<void>;
}

export const useCategoryManagement = ({
  projectId,
  engineerId,
  dispatch,
  loadCategories,
}: UseCategoryManagementParams) => {
  const seedDefaultCategories = useCallback(async () => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const existingDefaults = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', TOP_LEVEL_CATEGORY_TYPE),
          Q.where('is_default', true),
        )
        .fetch();

      if (existingDefaults.length === 0) {
        const defaultCategoryLabels = DOCUMENT_TYPES.map((t) => t.label);
        await database.write(async () => {
          for (let i = 0; i < defaultCategoryLabels.length; i++) {
            await categoriesCollection.create((rec: any) => {
              rec.name = defaultCategoryLabels[i];
              rec.documentType = TOP_LEVEL_CATEGORY_TYPE;
              rec.projectId = projectId;
              rec.isDefault = true;
              rec.sequenceOrder = i + 1;
              rec.createdBy = engineerId;
              rec.createdAt = Date.now();
              rec.updatedAt = Date.now();
              rec.appSyncStatus = 'pending';
              rec.version = 1;
            });
          }
          for (let i = 0; i < DEFAULT_INSTALLATION_CATEGORIES.length; i++) {
            await categoriesCollection.create((rec: any) => {
              rec.name = DEFAULT_INSTALLATION_CATEGORIES[i];
              rec.documentType = 'installation';
              rec.projectId = projectId;
              rec.isDefault = true;
              rec.sequenceOrder = i + 1;
              rec.createdBy = engineerId;
              rec.createdAt = Date.now();
              rec.updatedAt = Date.now();
              rec.appSyncStatus = 'pending';
              rec.version = 1;
            });
          }
        });

        logger.info('[DesignDocument] Seeded default top-level and installation sub-categories');
        await loadCategories();
      }
    } catch (error: any) {
      logger.error('[DesignDocument] Error seeding default categories:', error);
    }
  }, [projectId, engineerId, loadCategories]);

  const handleAddCategory = useCallback(
    async (name: string) => {
      if (!projectId || !engineerId) return;

      try {
        const categoriesCollection = database.collections.get('design_document_categories');
        const existingCategories = await categoriesCollection
          .query(
            Q.where('project_id', projectId),
            Q.where('document_type', TOP_LEVEL_CATEGORY_TYPE),
          )
          .fetch();

        let newCategory: DesignDocumentCategory | null = null;

        await database.write(async () => {
          const record = await categoriesCollection.create((rec: any) => {
            rec.name = name;
            rec.documentType = TOP_LEVEL_CATEGORY_TYPE;
            rec.projectId = projectId;
            rec.isDefault = false;
            rec.sequenceOrder = existingCategories.length + 1;
            rec.createdBy = engineerId;
            rec.createdAt = Date.now();
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });

          newCategory = {
            id: record.id,
            name,
            documentType: TOP_LEVEL_CATEGORY_TYPE,
            projectId,
            isDefault: false,
            sequenceOrder: existingCategories.length + 1,
          };
        });

        if (newCategory) {
          dispatch({ type: 'ADD_CATEGORY', payload: { category: newCategory } });
        }
      } catch (error: any) {
        logger.error('[DesignDocument] Error adding category:', error);
        Alert.alert('Error', 'Failed to add category');
      }
    },
    [projectId, engineerId, dispatch],
  );

  const handleAddSubCategory = useCallback(
    async (name: string, parentSlug: string) => {
      if (!projectId || !engineerId) return;

      try {
        const categoriesCollection = database.collections.get('design_document_categories');
        const existingSubs = await categoriesCollection
          .query(
            Q.where('project_id', projectId),
            Q.where('document_type', parentSlug),
          )
          .fetch();

        let newCategory: DesignDocumentCategory | null = null;

        await database.write(async () => {
          const record = await categoriesCollection.create((rec: any) => {
            rec.name = name;
            rec.documentType = parentSlug;
            rec.projectId = projectId;
            rec.isDefault = false;
            rec.sequenceOrder = existingSubs.length + 1;
            rec.createdBy = engineerId;
            rec.createdAt = Date.now();
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });

          newCategory = {
            id: record.id,
            name,
            documentType: parentSlug as any,
            projectId,
            isDefault: false,
            sequenceOrder: existingSubs.length + 1,
          };
        });

        if (newCategory) {
          dispatch({ type: 'ADD_CATEGORY', payload: { category: newCategory } });
        }
      } catch (error: any) {
        logger.error('[DesignDocument] Error adding sub-category:', error);
        Alert.alert('Error', 'Failed to add document type');
      }
    },
    [projectId, engineerId, dispatch],
  );

  const handleUpdateCategory = useCallback(
    async (categoryId: string, newName: string) => {
      if (!projectId) return;

      try {
        const categoriesCollection = database.collections.get('design_document_categories');
        const record = await categoriesCollection.find(categoryId);

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.name = newName;
            rec.updatedAt = Date.now();
          });
        });

        dispatch({ type: 'UPDATE_CATEGORY', payload: { categoryId, name: newName } });
      } catch (error: any) {
        logger.error('[DesignDocument] Error updating category:', error);
        Alert.alert('Error', 'Failed to update category');
      }
    },
    [projectId, dispatch],
  );

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        const categoriesCollection = database.collections.get('design_document_categories');
        const record = await categoriesCollection.find(categoryId);
        const categoryName = (record as any).name;

        const docsCollection = database.collections.get('design_documents');
        const docsUsingCategory = await docsCollection
          .query(Q.where('category_id', categoryId))
          .fetchCount();

        if (docsUsingCategory > 0) {
          Alert.alert(
            'Cannot Delete',
            'This category is used by existing documents. Remove documents first.',
          );
          return;
        }

        const categoryRecord = record as any;
        if (categoryRecord.documentType === TOP_LEVEL_CATEGORY_TYPE) {
          const slug = categoryName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '');
          const docsWithType = await docsCollection
            .query(Q.where('document_type', slug))
            .fetchCount();

          if (docsWithType > 0) {
            Alert.alert(
              'Cannot Delete',
              `This category has ${docsWithType} document(s) of type "${categoryName}". Remove them first.`,
            );
            return;
          }
        }

        await database.write(async () => {
          await record.markAsDeleted();
        });

        dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId } });
      } catch (error: any) {
        logger.error('[DesignDocument] Error deleting category:', error);
        Alert.alert('Error', 'Failed to delete category');
      }
    },
    [dispatch],
  );

  return {
    seedDefaultCategories,
    handleAddCategory,
    handleAddSubCategory,
    handleUpdateCategory,
    handleDeleteCategory,
  };
};
