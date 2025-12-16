# Phase 2 Kickoff Plan - Supervisor Improvements

**Project:** Site Progress Tracker v2.12+
**Phase:** Phase 2 - Important Improvements
**Status:** 🚀 READY TO BEGIN
**Start Date:** December 12, 2025 (Planned)
**Duration:** 35-46 hours (5-6 days, Week 2-3)
**Priority:** MEDIUM

---

## Executive Summary

Phase 2 focuses on improving state management, creating shared components, and enhancing user experience with loading states. Building on Phase 1's success (77.5% code reduction, 98% test pass rate), Phase 2 aims to:

- Replace complex useState patterns with useReducer
- Create reusable hooks and components
- Add loading skeletons for better perceived performance
- Reduce code duplication by 40%+
- Increase automated test coverage to 70%+

---

## Phase 1 Success Recap

**Achievements:**
✅ 5/5 tasks completed (100%)
✅ 215+ tests executed, 98% pass rate
✅ 3,087 → 693 lines (77.5% reduction)
✅ 0 TypeScript errors
✅ 0 critical issues
✅ ~24h actual vs 24-32h estimate (ON TARGET)

**Ready for Phase 2:**
- All code committed and tested
- Documentation 90% complete
- Minor issues triaged (non-blocking)
- Strong team momentum

---

## Phase 2 Goals

### Primary Objectives

1. **State Management Refactoring (Task 2.1)**
   - Replace 19+ useState hooks in DailyReportsScreen
   - Implement useReducer pattern for complex state
   - Improve performance and maintainability

2. **Shared Components Library (Task 2.2)**
   - Extract reusable hooks (validation, sync, etc.)
   - Create shared dialog components
   - Eliminate code duplication (40%+ target)

3. **Loading Experience (Task 2.3)**
   - Replace ActivityIndicator with skeletons
   - Improve perceived performance
   - Better user experience on slow networks

### Success Metrics

| Metric | Target | How We'll Measure |
|--------|--------|-------------------|
| useState Reduction | Replace 19+ hooks | Count in refactored files |
| Code Duplication | -40% | Before/after LOC comparison |
| Shared Hooks Created | 3+ new hooks | File count in src/hooks/ |
| Shared Components | 4+ components | File count in src/components/ |
| Test Coverage | 70%+ | Jest coverage report |
| Performance | No regressions | React DevTools profiler |
| TypeScript Errors | 0 | tsc --noEmit |

---

## Phase 2 Task Breakdown

### Task 2.1: State Management with useReducer (12-16 hours)

**Status:** 🔄 NEXT UP
**Priority:** HIGH
**Assignee:** TBD
**Estimated Time:** 12-16 hours (1.5-2 days)

#### Scope

**Target Screens:**
1. DailyReportsScreen (19+ useState hooks) - PRIMARY TARGET
2. SiteInspectionScreen - If time permits
3. HindranceReportScreen - If time permits

#### Deliverables

**1. Create Reducers (4-6 hours)**

```typescript
// src/supervisor/daily_reports/state/reportReducer.ts
interface ReportState {
  // Form state
  selectedItem: ItemModel | null;
  form: {
    quantity: string;
    notes: string;
  };

  // UI state
  dialogs: {
    visible: boolean;
    confirmVisible: boolean;
  };

  // Data state
  photos: string[];
  loading: boolean;
  errors: Record<string, string>;
}

type ReportAction =
  | { type: 'SELECT_ITEM'; payload: ItemModel }
  | { type: 'UPDATE_FORM'; payload: Partial<ReportState['form']> }
  | { type: 'ADD_PHOTO'; payload: string }
  | { type: 'REMOVE_PHOTO'; payload: number }
  | { type: 'SHOW_DIALOG' }
  | { type: 'HIDE_DIALOG' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'RESET_FORM' };

export const reportReducer = (
  state: ReportState,
  action: ReportAction
): ReportState => {
  switch (action.type) {
    case 'SELECT_ITEM':
      return { ...state, selectedItem: action.payload };

    case 'UPDATE_FORM':
      return {
        ...state,
        form: { ...state.form, ...action.payload }
      };

    case 'ADD_PHOTO':
      return {
        ...state,
        photos: [...state.photos, action.payload]
      };

    case 'REMOVE_PHOTO':
      return {
        ...state,
        photos: state.photos.filter((_, i) => i !== action.payload)
      };

    case 'SHOW_DIALOG':
      return {
        ...state,
        dialogs: { ...state.dialogs, visible: true }
      };

    case 'HIDE_DIALOG':
      return {
        ...state,
        dialogs: { ...state.dialogs, visible: false }
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.message
        }
      };

    case 'RESET_FORM':
      return initialState;

    default:
      return state;
  }
};

export const initialState: ReportState = {
  selectedItem: null,
  form: { quantity: '', notes: '' },
  dialogs: { visible: false, confirmVisible: false },
  photos: [],
  loading: false,
  errors: {}
};
```

**Files to Create:**
- `src/supervisor/daily_reports/state/reportReducer.ts`
- `src/supervisor/daily_reports/state/reportActions.ts` (action creators)
- `src/supervisor/daily_reports/state/index.ts` (barrel export)

**2. Refactor Components to Use Reducer (4-6 hours)**

**Before (useState pattern):**
```typescript
const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
const [quantity, setQuantity] = useState('');
const [notes, setNotes] = useState('');
const [photos, setPhotos] = useState<string[]>([]);
const [dialogVisible, setDialogVisible] = useState(false);
const [confirmVisible, setConfirmVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
// ... 11 more useState hooks
```

**After (useReducer pattern):**
```typescript
const [state, dispatch] = useReducer(reportReducer, initialState);

// Usage
dispatch({ type: 'SELECT_ITEM', payload: item });
dispatch({ type: 'UPDATE_FORM', payload: { quantity: '10' } });
dispatch({ type: 'ADD_PHOTO', payload: photoUri });
```

**3. Update Hooks to Use Reducer (2-3 hours)**

Update `useReportForm.ts` to work with reducer state:

```typescript
export const useReportForm = (dispatch: Dispatch<ReportAction>) => {
  const handleQuantityChange = (value: string) => {
    dispatch({ type: 'UPDATE_FORM', payload: { quantity: value } });
  };

  const handleSubmit = async (state: ReportState) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Submit logic
      dispatch({ type: 'RESET_FORM' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { field: 'submit', message: error.message }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return { handleQuantityChange, handleSubmit };
};
```

**4. Testing & Validation (2-3 hours)**

- Unit tests for reducers
- Integration tests for components
- Performance profiling (before/after)
- Manual testing of all flows

#### Steps

1. **Day 1 (6-8h):**
   - [ ] Create `reportReducer.ts` with all actions
   - [ ] Create `reportActions.ts` with action creators
   - [ ] Write unit tests for reducer (all action types)
   - [ ] Test reducer with edge cases

2. **Day 2 (6-8h):**
   - [ ] Refactor `DailyReportsScreen.tsx` to use reducer
   - [ ] Update `useReportForm.ts` to work with reducer
   - [ ] Update `useReportSync.ts` to work with reducer
   - [ ] Fix TypeScript errors
   - [ ] Manual testing of all features
   - [ ] Performance testing (React DevTools)
   - [ ] Document changes

#### QA Checklist

- [ ] TypeScript compilation: 0 errors
- [ ] All reducer actions tested
- [ ] All UI flows work (create, edit, delete, submit)
- [ ] No performance regressions
- [ ] State updates are predictable
- [ ] Unit tests pass (>80% coverage for reducer)
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Documentation updated

#### Success Criteria

- ✅ 19+ useState replaced with 1 useReducer
- ✅ State management is clearer and more maintainable
- ✅ All features work as before (no regressions)
- ✅ Performance is same or better
- ✅ Test coverage >80% for state logic

---

### Task 2.2: Shared Hooks and Components (17-22 hours)

**Status:** ⏳ Pending (After Task 2.1)
**Priority:** HIGH
**Assignee:** TBD
**Estimated Time:** 17-22 hours (2-3 days)

#### Scope

Create reusable hooks and components to eliminate code duplication across supervisor screens.

#### Sub-Tasks

##### 2.2.1: useFormValidation Hook (3-4 hours)

**Purpose:** Generic form validation logic

**Implementation:**
```typescript
// src/hooks/useFormValidation.ts
interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

interface ValidationSchema<T extends Record<string, any>> {
  [K in keyof T]?: ValidationRule<T[K]>;
}

export const useFormValidation = <T extends Record<string, any>>(
  schema: ValidationSchema<T>
) => {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (field: keyof T, value: T[keyof T]): boolean => {
    const rules = schema[field];
    if (!rules) return true;

    // Required check
    if (rules.required && !value) {
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
      return false;
    }

    // Min length check
    if (rules.minLength && String(value).length < rules.minLength) {
      setErrors(prev => ({
        ...prev,
        [field]: `Minimum ${rules.minLength} characters required`
      }));
      return false;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(String(value))) {
      setErrors(prev => ({ ...prev, [field]: 'Invalid format' }));
      return false;
    }

    // Custom validation
    if (rules.custom) {
      const error = rules.custom(value);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
        return false;
      }
    }

    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    return true;
  };

  const validateAll = (values: T): boolean => {
    let isValid = true;
    Object.keys(schema).forEach(field => {
      if (!validate(field as keyof T, values[field as keyof T])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const clearErrors = () => setErrors({});

  return { errors, validate, validateAll, clearErrors };
};
```

**Usage:**
```typescript
const { errors, validate, validateAll } = useFormValidation({
  title: { required: true, minLength: 3 },
  description: { required: true, minLength: 10 },
  quantity: {
    required: true,
    custom: (val) => Number(val) < 0 ? 'Must be positive' : null
  }
});

// In form
<TextInput
  value={title}
  onChangeText={(val) => {
    setTitle(val);
    validate('title', val);
  }}
  error={errors.title}
/>
```

**Screens to Apply:**
- SiteInspectionScreen (form validation)
- DailyReportsScreen (quantity validation)
- HindranceReportScreen (title, description validation)

---

##### 2.2.2: useOfflineSync Hook (4-5 hours)

**Purpose:** Unified sync logic with offline detection

**Implementation:**
```typescript
// src/hooks/useOfflineSync.ts
import NetInfo from '@react-native-community/netinfo';

interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

export const useOfflineSync = (options: SyncOptions = {}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  const sync = async () => {
    if (!isOnline) {
      logger.warn('Sync attempted while offline', { component: 'useOfflineSync' });
      return { success: false, error: 'No internet connection' };
    }

    setSyncStatus('syncing');

    try {
      const result = await SyncService.syncUp();
      setPendingCount(0);
      setSyncStatus('idle');
      return { success: true, result };
    } catch (error) {
      logger.error('Sync failed', { component: 'useOfflineSync', error });
      setSyncStatus('error');
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (options.autoSync && isOnline) {
      const interval = setInterval(sync, options.syncInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [isOnline, options.autoSync]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    sync
  };
};
```

**Usage:**
```typescript
const { isOnline, syncStatus, sync } = useOfflineSync({
  autoSync: true,
  syncInterval: 60000 // 1 minute
});

// In UI
{!isOnline && <Text>Offline Mode</Text>}
{syncStatus === 'syncing' && <ActivityIndicator />}
```

---

##### 2.2.3: Shared Dialog Components (4-5 hours)

**Purpose:** Reusable dialog patterns

**Components to Create:**

**1. FormDialog Component**
```typescript
// src/components/dialogs/FormDialog.tsx
interface FormDialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  saveDisabled?: boolean;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  visible,
  title,
  onClose,
  onSave,
  children,
  saveDisabled
}) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onClose}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.ScrollArea>
        <ScrollView>{children}</ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onClose}>Cancel</Button>
        <Button
          mode="contained"
          onPress={onSave}
          disabled={saveDisabled}
        >
          Save
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);
```

**2. PhotoPickerDialog Component**
```typescript
// src/components/dialogs/PhotoPickerDialog.tsx
interface PhotoPickerDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
}

export const PhotoPickerDialog: React.FC<PhotoPickerDialogProps> = ({
  visible,
  onDismiss,
  onTakePhoto,
  onChooseFromGallery
}) => (
  <Menu visible={visible} onDismiss={onDismiss}>
    <Menu.Item
      leadingIcon="camera"
      onPress={onTakePhoto}
      title="Take Photo"
    />
    <Menu.Item
      leadingIcon="image"
      onPress={onChooseFromGallery}
      title="Choose from Gallery"
    />
  </Menu>
);
```

**3. Enhance ConfirmDialog Component**
```typescript
// src/components/dialogs/ConfirmDialog.tsx
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel
}) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onCancel}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Text>{message}</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onCancel}>{cancelText}</Button>
        <Button
          mode="contained"
          buttonColor={confirmColor}
          onPress={onConfirm}
        >
          {confirmText}
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);
```

**Files to Create:**
- `src/components/dialogs/FormDialog.tsx`
- `src/components/dialogs/PhotoPickerDialog.tsx`
- `src/components/dialogs/ConfirmDialog.tsx` (enhance existing)
- `src/components/dialogs/index.ts` (barrel export)

---

##### 2.2.4: Additional Shared Components (4-5 hours)

**1. SyncStatusChip Component**
```typescript
// src/components/common/SyncStatusChip.tsx
interface SyncStatusChipProps {
  status: 'pending' | 'synced' | 'error';
  onPress?: () => void;
}

export const SyncStatusChip: React.FC<SyncStatusChipProps> = ({
  status,
  onPress
}) => {
  const config = {
    pending: { icon: 'clock-outline', color: 'orange', text: 'Pending' },
    synced: { icon: 'check-circle', color: 'green', text: 'Synced' },
    error: { icon: 'alert-circle', color: 'red', text: 'Error' }
  };

  const { icon, color, text } = config[status];

  return (
    <Chip
      icon={icon}
      mode="outlined"
      textStyle={{ color }}
      onPress={onPress}
    >
      {text}
    </Chip>
  );
};
```

**2. EmptyState Component**
```typescript
// src/components/common/EmptyState.tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  onAction
}) => (
  <View style={styles.container}>
    <Icon name={icon} size={64} color="#ccc" />
    <Text variant="headlineSmall" style={styles.title}>
      {title}
    </Text>
    <Text variant="bodyMedium" style={styles.message}>
      {message}
    </Text>
    {actionText && onAction && (
      <Button mode="contained" onPress={onAction} style={styles.button}>
        {actionText}
      </Button>
    )}
  </View>
);
```

**3. LoadingOverlay Component**
```typescript
// src/components/common/LoadingOverlay.tsx
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...'
}) => {
  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.overlay}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Portal>
  );
};
```

---

##### 2.2.5: Refactor Screens to Use Shared Components (2-3 hours)

**Apply shared components to:**
- SiteInspectionScreen (FormDialog, PhotoPicker, ConfirmDialog)
- DailyReportsScreen (SyncStatusChip, EmptyState, LoadingOverlay)
- HindranceReportScreen (FormDialog, PhotoPicker, SyncStatusChip)

---

#### Steps

1. **Day 1 (6-8h):**
   - [ ] Create `useFormValidation.ts`
   - [ ] Create `useOfflineSync.ts`
   - [ ] Write unit tests for both hooks
   - [ ] Test hooks in isolation

2. **Day 2 (6-8h):**
   - [ ] Create `FormDialog.tsx`
   - [ ] Create `PhotoPickerDialog.tsx`
   - [ ] Enhance `ConfirmDialog.tsx`
   - [ ] Create `SyncStatusChip.tsx`
   - [ ] Create `EmptyState.tsx`
   - [ ] Create `LoadingOverlay.tsx`
   - [ ] Write component tests

3. **Day 3 (5-6h):**
   - [ ] Refactor SiteInspectionScreen to use shared components
   - [ ] Refactor DailyReportsScreen to use shared components
   - [ ] Refactor HindranceReportScreen to use shared components
   - [ ] Fix TypeScript errors
   - [ ] Manual testing
   - [ ] Documentation

#### QA Checklist

- [ ] TypeScript compilation: 0 errors
- [ ] All hooks tested (>90% coverage)
- [ ] All components tested (>80% coverage)
- [ ] Hooks work across all screens
- [ ] Components render correctly
- [ ] No duplicate code remaining
- [ ] Performance is same or better
- [ ] Manual testing complete
- [ ] Documentation updated

#### Success Criteria

- ✅ 3+ shared hooks created and tested
- ✅ 6+ shared components created
- ✅ Code duplication reduced by 40%+
- ✅ All screens use shared components
- ✅ Test coverage >80%

---

### Task 2.3: Add Loading Skeletons (6-8 hours)

**Status:** ⏳ Pending (After Task 2.2)
**Priority:** MEDIUM
**Assignee:** TBD
**Estimated Time:** 6-8 hours (1 day)

#### Scope

Replace generic loading indicators with skeleton screens for better perceived performance.

#### Deliverables

##### 1. Create Skeleton Components (3-4 hours)

**SkeletonCard Component:**
```typescript
// src/components/skeletons/SkeletonCard.tsx
export const SkeletonCard: React.FC = () => (
  <Surface style={styles.card}>
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item flexDirection="column">
        {/* Title */}
        <SkeletonPlaceholder.Item width="60%" height={20} marginBottom={8} />
        {/* Subtitle */}
        <SkeletonPlaceholder.Item width="40%" height={16} marginBottom={12} />
        {/* Content */}
        <SkeletonPlaceholder.Item width="100%" height={60} marginBottom={8} />
        {/* Actions */}
        <SkeletonPlaceholder.Item flexDirection="row" justifyContent="space-between">
          <SkeletonPlaceholder.Item width={80} height={36} />
          <SkeletonPlaceholder.Item width={80} height={36} />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  </Surface>
);
```

**SkeletonList Component:**
```typescript
// src/components/skeletons/SkeletonList.tsx
interface SkeletonListProps {
  count?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);
```

**SkeletonForm Component:**
```typescript
// src/components/skeletons/SkeletonForm.tsx
export const SkeletonForm: React.FC = () => (
  <View style={styles.container}>
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item flexDirection="column">
        {/* Form title */}
        <SkeletonPlaceholder.Item width="50%" height={24} marginBottom={16} />

        {/* Input fields */}
        {[1, 2, 3, 4].map(i => (
          <SkeletonPlaceholder.Item key={i} marginBottom={16}>
            <SkeletonPlaceholder.Item width="30%" height={14} marginBottom={8} />
            <SkeletonPlaceholder.Item width="100%" height={48} />
          </SkeletonPlaceholder.Item>
        ))}

        {/* Buttons */}
        <SkeletonPlaceholder.Item flexDirection="row" justifyContent="flex-end" marginTop={16}>
          <SkeletonPlaceholder.Item width={100} height={40} marginRight={8} />
          <SkeletonPlaceholder.Item width={100} height={40} />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  </View>
);
```

**Files to Create:**
- `src/components/skeletons/SkeletonCard.tsx`
- `src/components/skeletons/SkeletonList.tsx`
- `src/components/skeletons/SkeletonForm.tsx`
- `src/components/skeletons/SkeletonHeader.tsx`
- `src/components/skeletons/index.ts`

##### 2. Install Skeleton Library (30 min)

```bash
npm install react-native-skeleton-placeholder
```

Update TypeScript types if needed.

##### 3. Apply to Screens (2-3 hours)

**Before:**
```typescript
{loading && <ActivityIndicator />}
{!loading && <InspectionList data={inspections} />}
```

**After:**
```typescript
{loading ? (
  <SkeletonList count={5} />
) : (
  <InspectionList data={inspections} />
)}
```

**Screens to Update:**
- SiteInspectionScreen (inspection list)
- DailyReportsScreen (items list)
- HindranceReportScreen (hindrance list)
- ReportsHistoryScreen (reports list)
- ItemsManagementScreen (items list)

##### 4. Testing (1 hour)

- Test on slow network (Chrome DevTools throttling)
- Test on fast network
- Verify skeleton matches final layout
- Check animations are smooth

#### Steps

- [ ] Install `react-native-skeleton-placeholder`
- [ ] Create SkeletonCard component
- [ ] Create SkeletonList component
- [ ] Create SkeletonForm component
- [ ] Create SkeletonHeader component
- [ ] Apply to SiteInspectionScreen
- [ ] Apply to DailyReportsScreen
- [ ] Apply to HindranceReportScreen
- [ ] Apply to ReportsHistoryScreen
- [ ] Apply to ItemsManagementScreen
- [ ] Test on slow network
- [ ] Test animations
- [ ] Documentation

#### QA Checklist

- [ ] TypeScript compilation: 0 errors
- [ ] All skeleton components render correctly
- [ ] Skeletons match final layout
- [ ] Smooth animations (60fps)
- [ ] Works on slow/fast networks
- [ ] No performance regressions
- [ ] Manual testing complete
- [ ] Documentation updated

#### Success Criteria

- ✅ All loading states use skeletons
- ✅ Skeletons match layout
- ✅ Smooth animations
- ✅ Better perceived performance

---

## Testing Strategy

### Automated Testing

**Unit Tests:**
- [ ] Reducer tests (all action types)
- [ ] Shared hooks tests (validation, sync)
- [ ] Component tests (render, props, interactions)

**Integration Tests:**
- [ ] Form submission flows
- [ ] Sync operations
- [ ] Navigation flows

**Target Coverage:** 70%+

### Manual Testing

**Test Checklist Template:**

For each refactored screen:
- [ ] Screen loads without errors
- [ ] All CRUD operations work
- [ ] Forms validate correctly
- [ ] Sync operations work (online/offline)
- [ ] Loading states display correctly
- [ ] No regressions from Phase 1
- [ ] Performance is acceptable

### Performance Testing

**Metrics to Track:**
- Screen load time (<2s)
- Form submission time
- Memory usage (<50MB per screen)
- Frame rate (60fps)

**Tools:**
- React DevTools Profiler
- Flipper Performance Plugin
- Android Studio Profiler

---

## Risk Management

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| useState to useReducer breaks features | High | Medium | Thorough testing, gradual rollout |
| Performance degradation with skeletons | Medium | Low | Performance benchmarks, A/B testing |
| Time overrun on Task 2.2 | Medium | Medium | Buffer time, prioritize critical hooks first |
| Shared components too generic | Low | Low | Start specific, generalize later |

### Contingency Plans

**If Task 2.1 takes too long:**
- Focus on DailyReportsScreen only
- Defer other screens to Phase 3

**If Task 2.2 grows in scope:**
- Create only critical hooks (validation, sync)
- Defer nice-to-have components to Phase 3

**If testing reveals major issues:**
- Roll back changes
- Debug and fix before proceeding

---

## Timeline

### Week 2-3 Schedule

**Day 1-2 (Task 2.1): State Management**
- Day 1: Create reducers and tests (6-8h)
- Day 2: Refactor components, test (6-8h)

**Day 3-5 (Task 2.2): Shared Components**
- Day 3: Create hooks (6-8h)
- Day 4: Create dialog components (6-8h)
- Day 5: Refactor screens, test (5-6h)

**Day 6 (Task 2.3): Skeletons**
- Day 6: Create skeletons, apply to screens (6-8h)

**Day 7 (Buffer):**
- Catch-up time
- Additional testing
- Documentation
- Code review

---

## Documentation Requirements

### During Development

For each task:
- [ ] Update component README
- [ ] Add JSDoc comments
- [ ] Update ARCHITECTURE_UNIFIED.md
- [ ] Create usage examples

### After Phase 2

- [ ] Update SUPERVISOR_IMPROVEMENTS_ROADMAP.md
- [ ] Create PHASE_2_COMPLETION_SUMMARY.md
- [ ] Update README.md with Phase 2 features
- [ ] Create migration guide (if breaking changes)
- [ ] Update testing documentation

---

## Success Metrics

### Phase 2 Completion Criteria

- [x] All 3 tasks completed
- [x] TypeScript: 0 errors
- [x] Test coverage: >70%
- [x] Manual testing: 100% pass
- [x] Performance: No regressions
- [x] Documentation: 100% complete
- [x] Code reviewed and approved

### Post-Phase 2 Goals

**Code Quality:**
- ✅ Reduced useState by 80%+
- ✅ Code duplication down 40%+
- ✅ Shared hooks: 5+
- ✅ Shared components: 10+

**Performance:**
- ✅ Load time: <2s
- ✅ Frame rate: 60fps
- ✅ Memory: <50MB per screen

**Testing:**
- ✅ Unit test coverage: 70%+
- ✅ Integration tests: Key flows covered
- ✅ Manual test pass rate: 100%

---

## Phase 3 Preview

**After Phase 2, we'll move to Phase 3 (Nice-to-Have):**

Tasks:
1. Navigation UX Restructure (17-23h)
2. Accessibility Improvements (11-14h)
3. Enhanced Empty States (7-9h)
4. Search & Filter Performance (6-8h)
5. Offline Mode Indicators (6-8h)

**Total:** 47-62 hours (6-8 days, Week 4-5)

---

## Appendix

### Useful Commands

```bash
# TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Test with coverage
npm test -- --coverage

# Run specific test
npm test -- ReducerTest

# Lint
npm run lint

# Build
npm run android
npm run ios

# Performance profiling
npm run android -- --mode=Release
```

### File Structure After Phase 2

```
src/
├── supervisor/
│   ├── daily_reports/
│   │   ├── DailyReportsScreen.tsx          (using useReducer)
│   │   ├── components/                     (using shared components)
│   │   ├── hooks/                          (using shared hooks)
│   │   ├── state/                          [NEW]
│   │   │   ├── reportReducer.ts
│   │   │   ├── reportActions.ts
│   │   │   └── index.ts
│   │   └── utils/
│   ├── site_inspection/                    (Phase 1 structure)
│   └── hindrance_reports/                  (Phase 1 structure)
├── hooks/                                   [EXPANDED]
│   ├── usePhotoUpload.ts                   (Phase 1)
│   ├── useChecklist.ts                     (Phase 1)
│   ├── useFormValidation.ts                [NEW - Phase 2]
│   ├── useOfflineSync.ts                   [NEW - Phase 2]
│   └── index.ts
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.tsx               (Phase 1)
│   │   ├── SyncStatusChip.tsx              [NEW - Phase 2]
│   │   ├── EmptyState.tsx                  [NEW - Phase 2]
│   │   ├── LoadingOverlay.tsx              [NEW - Phase 2]
│   │   └── index.ts
│   ├── dialogs/                            [NEW - Phase 2]
│   │   ├── FormDialog.tsx
│   │   ├── PhotoPickerDialog.tsx
│   │   ├── ConfirmDialog.tsx               (enhanced)
│   │   └── index.ts
│   └── skeletons/                          [NEW - Phase 2]
│       ├── SkeletonCard.tsx
│       ├── SkeletonList.tsx
│       ├── SkeletonForm.tsx
│       ├── SkeletonHeader.tsx
│       └── index.ts
└── services/
    └── LoggingService.ts                   (Phase 1)
```

### Resources

**React Hooks:**
- [useReducer Documentation](https://react.dev/reference/react/useReducer)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)

**Performance:**
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)

**Testing:**
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

**Skeleton Screens:**
- [react-native-skeleton-placeholder](https://github.com/chramos/react-native-skeleton-placeholder)

---

## Sign-Off

**Phase 2 Kickoff Authorization**

- [x] Phase 1 completed and approved
- [x] Phase 2 plan reviewed and accepted
- [x] Resources allocated
- [x] Timeline agreed upon
- [x] Success criteria defined

**Authorized By:** ___________________
**Date:** December 12, 2025
**Start Date:** December 12, 2025

---

**Ready to begin Phase 2! 🚀**

**Questions or concerns? Discuss before starting Task 2.1.**

**Let's build something great!**

