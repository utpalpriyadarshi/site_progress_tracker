import HindranceModel from '../../../models/HindranceModel';
import SiteModel from '../../../models/SiteModel';
import ItemModel from '../../../models/ItemModel';

export type HindrancePriority = 'low' | 'medium' | 'high';
export type HindranceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface HindranceWithDetails {
  hindrance: HindranceModel;
  site: SiteModel;
  item?: ItemModel;
}

export interface HindranceFormData {
  title: string;
  description: string;
  priority: HindrancePriority;
  status: HindranceStatus;
  selectedItemId: string;
  photos: string[];
}
