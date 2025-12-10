/**
 * Type definitions for Site Inspection module
 */

import SiteInspectionModel from '../../../models/SiteInspectionModel';
import SiteModel from '../../../models/SiteModel';
import { ChecklistItem } from '../../hooks/useChecklist';

/**
 * Inspection combined with site data
 */
export interface InspectionWithSite {
  inspection: SiteInspectionModel;
  site: SiteModel;
}

/**
 * Inspection type options
 */
export type InspectionType = 'daily' | 'weekly' | 'safety' | 'quality';

/**
 * Overall rating options
 */
export type OverallRating = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Form data for creating/updating inspections
 */
export interface InspectionFormData {
  inspectionType: InspectionType;
  overallRating: OverallRating;
  safetyFlagged: boolean;
  notes: string;
  checklistData: ChecklistItem[];
  photos: string[];
  followUpRequired: boolean;
  followUpDate: string;
  followUpNotes: string;
}

/**
 * Props for PhotoGallery component
 */
export interface PhotoGalleryProps {
  photos: string[];
  maxPhotos?: number;
  onTakePhoto: () => Promise<void>;
  onSelectPhoto: () => Promise<void>;
  onRemovePhoto: (index: number) => void;
  photoMenuVisible: boolean;
  setPhotoMenuVisible: (visible: boolean) => void;
}

/**
 * Props for ChecklistSection component
 */
export interface ChecklistSectionProps {
  checklistData: ChecklistItem[];
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
  onUpdateItem: (id: string, field: 'status' | 'notes', value: any) => void;
}

/**
 * Props for InspectionCard component
 */
export interface InspectionCardProps {
  inspection: SiteInspectionModel;
  site: SiteModel;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Props for InspectionList component
 */
export interface InspectionListProps {
  inspections: InspectionWithSite[];
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (inspectionWithSite: InspectionWithSite) => void;
  onDelete: (inspection: SiteInspectionModel) => void;
  emptyMessage?: string;
}

/**
 * Props for InspectionForm component
 */
export interface InspectionFormProps {
  visible: boolean;
  editingInspection: SiteInspectionModel | null;
  selectedSiteId: string | 'all';
  onSave: (data: InspectionFormData) => Promise<void>;
  onCancel: () => void;
}
