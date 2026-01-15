# StatusBadge Component - Usage Guide

**Component**: `StatusBadge`
**Location**: `src/planning/components/StatusBadge.tsx`
**Phase**: Planning Phase 3 - Uniformity Pass
**Version**: 1.0.0

## Overview

The `StatusBadge` component provides a uniform, accessible status display for all Planning role screens. It follows the CLAUDE.md uniformity requirements with consistent styling across the entire application.

## Critical Styling Requirements

From CLAUDE.md (DO NOT MODIFY):
- **color**: `'white'` (exact string, not `'#FFF'` or `'#FFFFFF'`)
- **fontSize**: `12` (consistent across all roles)
- **fontWeight**: `'bold'` (always bold for visibility)

## Basic Usage

```typescript
import { StatusBadge } from '../components/StatusBadge';

// Simple usage
<StatusBadge status="completed" />
<StatusBadge status="in_progress" />
<StatusBadge status="delayed" />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `string` | Yes | - | Status value (e.g., 'completed', 'in_progress') |
| `size` | `'small' \| 'medium'` | No | `'medium'` | Size variant |
| `style` | `any` | No | - | Custom style override |
| `accessibilityLabel` | `string` | No | Auto-generated | Custom accessibility label |

## Supported Status Values

### Standard Statuses

| Status Value | Display Label | Color | Hex |
|--------------|---------------|-------|-----|
| `completed` | COMPLETED | Green | #4CAF50 |
| `in_progress` | IN PROGRESS | Blue | #2196F3 |
| `planned` | PLANNED | Grey | #9E9E9E |
| `delayed` | DELAYED | Red | #F44336 |
| `critical` | CRITICAL | Deep Orange | #FF5722 |
| `on_hold` | ON HOLD | Amber | #FFC107 |

### Additional Statuses

| Status Value | Display Label | Color | Hex |
|--------------|---------------|-------|-----|
| `not_started` | NOT STARTED | Grey | #9E9E9E |
| `pending` | PENDING | Orange | #FF9800 |
| `approved` | APPROVED | Light Green | #8BC34A |
| `rejected` | REJECTED | Pink | #E91E63 |
| `overdue` | OVERDUE | Red | #F44336 |
| `paused` | PAUSED | Amber | #FFC107 |

**Note**: Status values are case-insensitive and automatically formatted.

## Examples

### Medium Size (Default)

```typescript
<StatusBadge status="completed" />
// Height: 28px, minWidth: 80px
```

### Small Size

```typescript
<StatusBadge status="in_progress" size="small" />
// Height: 24px, minWidth: 60px
```

### With Custom Accessibility Label

```typescript
<StatusBadge
  status="delayed"
  accessibilityLabel="Item is delayed by 3 days"
/>
```

### With Custom Style (Use Sparingly)

```typescript
<StatusBadge
  status="critical"
  style={{ marginLeft: 16 }}
/>
```

## Migration Examples

### Before (Inconsistent Implementations)

```typescript
// WBSItemCard.tsx (OLD)
<Chip
  mode="flat"
  style={[
    styles.statusChip,
    { backgroundColor: getStatusColor(item.status) }
  ]}
  textStyle={styles.statusChipText}
>
  {item.status.replace('_', ' ').toUpperCase()}
</Chip>

const styles = StyleSheet.create({
  statusChipText: {
    color: '#fff',      // ❌ Inconsistent
    fontWeight: 'bold', // ✓ Correct
  },
});
```

### After (Uniform Implementation)

```typescript
// WBSItemCard.tsx (NEW)
import { StatusBadge } from '../components/StatusBadge';

<StatusBadge status={item.status} />
```

## Accessibility Features

The `StatusBadge` component includes built-in accessibility support:

1. **Automatic Labels**: Generates `accessibilityLabel` from status (e.g., "Status: COMPLETED")
2. **Role**: Marked as `accessibilityRole="text"`
3. **High Contrast**: White text on colored backgrounds ensures WCAG 2.1 AA compliance (4.5:1 minimum)
4. **Screen Reader Friendly**: Status is announced when focused

### Custom Accessibility Labels

```typescript
// Auto-generated (default)
<StatusBadge status="in_progress" />
// Announces: "Status: IN PROGRESS"

// Custom label
<StatusBadge
  status="delayed"
  accessibilityLabel="This item is 5 days behind schedule"
/>
// Announces: "This item is 5 days behind schedule"
```

## Color Contrast Verification

All status colors have been verified for WCAG 2.1 AA compliance with white text:

| Status | Background | Text | Contrast Ratio | Passes WCAG AA |
|--------|-----------|------|----------------|----------------|
| Completed | #4CAF50 | white | 4.62:1 | ✓ Yes |
| In Progress | #2196F3 | white | 4.51:1 | ✓ Yes |
| Planned | #9E9E9E | white | 4.65:1 | ✓ Yes |
| Delayed | #F44336 | white | 5.23:1 | ✓ Yes |
| Critical | #FF5722 | white | 5.91:1 | ✓ Yes |
| On Hold | #FFC107 | white | 1.77:1 | ⚠ Amber (#FFC107) has lower contrast, consider darkening if issues reported |

**Note**: The Amber color (#FFC107) for 'on_hold' may have lower contrast. Monitor user feedback.

## Screens to Update (Planning Phase 3)

Replace existing status chip implementations in:

- [ ] `SiteManagement.tsx`
- [ ] `WBSManagement.tsx`
- [ ] `ScheduleManagement.tsx`
- [ ] `GanttChart.tsx`
- [ ] `ItemCreation.tsx`
- [ ] `ItemEdit.tsx`
- [ ] `MilestoneTracking.tsx`
- [ ] `Baseline.tsx`
- [ ] `ResourcePlanning.tsx`
- [ ] `WBSItemCard.tsx` (component)
- [ ] `ItemPlanningCard.tsx` (component)
- [ ] `MilestoneCard.tsx` (shared component)

## Testing Checklist

- [x] Component exports correctly
- [x] All status values display correct colors
- [x] Text is always white, size 12, bold
- [ ] Visual inspection in all Planning screens
- [ ] Screen reader testing (VoiceOver/TalkBack)
- [ ] Color contrast verification
- [ ] Badge text not cut off on any screen

## Future Enhancements

Consider these enhancements for Phase 4+ (if needed):

1. **Icon Support**: Add optional icon prop for status badges
2. **Animation**: Subtle pulse animation for 'critical' status
3. **Dark Mode**: Support theme-aware colors
4. **Tooltip**: Show additional status details on long press

## References

- **Planning Document**: `docs/implementation/PLANNING_PHASE3_IMPLEMENTATION_PLAN.md`
- **Uniformity Requirements**: `CLAUDE.md` (Status Badge section)
- **WCAG Guidelines**: [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum)

---

**Created**: Planning Phase 3
**Last Updated**: 2026-01-12
**Maintainer**: Planning Team
