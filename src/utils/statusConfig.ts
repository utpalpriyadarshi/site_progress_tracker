import { COLORS } from '../theme/colors';

export const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  // RFQ statuses
  draft:           { color: COLORS.STATUS_DRAFT,      icon: 'pencil-outline',             label: 'Draft' },
  issued:          { color: COLORS.STATUS_ISSUED,     icon: 'send-outline',               label: 'Issued' },
  under_review:    { color: COLORS.WARNING,           icon: 'clock-outline',              label: 'Under Review' },
  quotes_received: { color: COLORS.WARNING,           icon: 'inbox-outline',              label: 'Quotes Received' },
  evaluated:       { color: COLORS.STATUS_EVALUATED,  icon: 'clipboard-check-outline',    label: 'Evaluated' },
  awarded:         { color: COLORS.STATUS_AWARDED,    icon: 'check-circle-outline',       label: 'Awarded' },
  // DOORS / document statuses
  pending:         { color: COLORS.STATUS_RECEIVED,   icon: 'clock-outline',              label: 'Pending' },
  received:        { color: COLORS.STATUS_ISSUED,     icon: 'inbox-arrow-down-outline',   label: 'Received' },
  reviewed:        { color: COLORS.STATUS_AWARDED,    icon: 'eye-check-outline',          label: 'Reviewed' },
  approved:        { color: COLORS.STATUS_EVALUATED,  icon: 'check-circle-outline',       label: 'Approved' },
  cancelled:       { color: COLORS.STATUS_CANCELLED,  icon: 'close-circle-outline',       label: 'Cancelled' },
  closed:          { color: COLORS.STATUS_CLOSED,     icon: 'archive-outline',            label: 'Closed' },
};
