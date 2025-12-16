import ItemModel from '../../../models/ItemModel';
import SiteModel from '../../../models/SiteModel';
import ProgressLogModel from '../../../models/ProgressLogModel';

/**
 * Item with site name for display
 */
export interface ItemWithSite {
  item: ItemModel;
  siteName: string;
}

/**
 * Progress report form data
 */
export interface ProgressFormData {
  quantityInput: string;
  notesInput: string;
  photos: string[];
}

/**
 * Photo count map for items
 */
export interface ItemPhotoCounts {
  [itemId: string]: number;
}

/**
 * Sync status types
 */
export type SyncStatus = 'pending' | 'synced' | 'error';

/**
 * Report submission result
 */
export interface ReportSubmissionResult {
  success: boolean;
  reportsGenerated: number;
  logsSubmitted: number;
  pdfPaths: string[];
  message: string;
}

/**
 * Item with progress log for reporting
 */
export interface ItemWithLog {
  item: ItemModel;
  progressLog: ProgressLogModel | null;
}
