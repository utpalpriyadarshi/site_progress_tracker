# Snackbar UX Improvements - Deferred to v2.1

## Overview

Based on user testing in Sprint 1 Day 2, two UX improvements were identified but deferred to v2.1 to keep Sprint 1 on schedule. This document tracks these enhancements for future implementation.

---

## Feature 1: Manual Close Button for Action Snackbars

### User Request
> "Snackbar with undo action is not desirable as it is closing after timeout, it should be permanent with manual close button."

### Current Behavior
- Snackbars with actions (e.g., "Undo" button) auto-dismiss after timeout
- Timeout is 4-6 seconds depending on message type
- User may not have time to click "Undo" before message disappears

### Requested Behavior
- Snackbars with actions should stay visible indefinitely
- Add manual close button (X icon) on right side
- Only dismiss when user clicks close button or action button
- No auto-dismiss timeout

### Implementation Plan

**Estimated Effort:** 1 day

**Changes Required:**

1. **Update SnackbarProvider.tsx:**
   - Add `indefinite` duration option
   - When action is present, set duration to Infinity
   - Add close icon button
   - Handle manual dismiss

2. **Update types.ts:**
```typescript
export interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number | 'indefinite'; // Add indefinite option
  action?: SnackbarAction;
  dismissible?: boolean; // Can user manually close it?
}
```

3. **Update SnackbarProvider.tsx:**
```typescript
// Don't auto-dismiss if action present
useEffect(() => {
  if (current && visible && !current.action) {
    // Only auto-dismiss if no action
    const duration = current.duration || getDefaultDuration(current.type);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(showNext, 300);
    }, duration);
    return () => clearTimeout(timer);
  }
}, [current, visible, showNext]);

// Add close button to Snackbar
<Snackbar
  visible={visible}
  onDismiss={hideSnackbar}
  duration={current?.action ? Infinity : (current?.duration || getDefaultDuration(current?.type || 'info'))}
  action={
    current?.action || current?.dismissible
      ? {
          label: current?.action?.label || 'Close',
          onPress: current?.action?.onPress || hideSnackbar,
        }
      : undefined
  }
  // ... rest of props
/>
```

### Benefits
- Better UX for important actions (undo, retry, view)
- User has full control over when to dismiss
- Prevents accidental misses of undo actions

### Considerations
- Screen clutter if user doesn't dismiss
- Need clear visual indicator it won't auto-close
- May need max snackbar limit (e.g., max 3 on screen)

---

## Feature 2: Vertical Stacking of Queued Messages

### User Request
> "All the message are quikly displaying not giving time for user to see, messages should be stacked vertically and disappear one by one."

### Current Behavior
- Multiple messages queue and show sequentially (one at a time)
- Each message waits for previous to dismiss before showing
- Only one snackbar visible at a time
- Follows Material Design guidelines

### Requested Behavior
- Multiple messages should stack vertically
- All messages visible at once (up to a limit, e.g., 3)
- Each message dismisses independently after its timeout
- Top message disappears, bottom messages slide up

### Implementation Plan

**Estimated Effort:** 2-3 days (major architectural change)

**Changes Required:**

1. **Redesign SnackbarProvider.tsx:**
   - Change from single `current` message to `visibleMessages` array
   - Support max 3 visible messages at once
   - Stack them vertically with spacing
   - Each has independent timer

2. **New Component: SnackbarStack.tsx:**
```typescript
const SnackbarStack = ({ messages, onDismiss }) => {
  return (
    <View style={styles.stack}>
      {messages.map((message, index) => (
        <Snackbar
          key={message.id}
          visible={true}
          onDismiss={() => onDismiss(message.id)}
          duration={message.duration}
          style={[
            styles.snackbar,
            { marginBottom: index === 0 ? 60 : 8 }, // Stack spacing
            { backgroundColor: getBackgroundColor(message.type) }
          ]}
        >
          {message.message}
        </Snackbar>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  snackbar: {
    width: '90%',
  },
});
```

3. **Update SnackbarProvider logic:**
```typescript
const [visibleMessages, setVisibleMessages] = useState<SnackbarMessage[]>([]);
const [queue, setQueue] = useState<SnackbarMessage[]>([]);
const MAX_VISIBLE = 3;

const showSnackbar = useCallback((message, type, action, duration) => {
  const newMessage = { id: Date.now().toString(), message, type, action, duration };

  if (visibleMessages.length < MAX_VISIBLE) {
    // Show immediately
    setVisibleMessages(prev => [...prev, newMessage]);
  } else {
    // Add to queue
    setQueue(prev => [...prev, newMessage]);
  }
}, [visibleMessages]);

const dismissMessage = useCallback((id: string) => {
  setVisibleMessages(prev => prev.filter(m => m.id !== id));

  // Show next from queue
  if (queue.length > 0) {
    const [next, ...rest] = queue;
    setVisibleMessages(prev => [...prev, next]);
    setQueue(rest);
  }
}, [queue]);

// Auto-dismiss timers for each message
useEffect(() => {
  const timers = visibleMessages.map(message => {
    if (!message.action) { // Don't auto-dismiss if has action
      const duration = message.duration || getDefaultDuration(message.type);
      return setTimeout(() => dismissMessage(message.id), duration);
    }
    return null;
  }).filter(Boolean);

  return () => timers.forEach(timer => timer && clearTimeout(timer));
}, [visibleMessages, dismissMessage]);
```

### Benefits
- Multiple messages visible at once
- Better for rapid operations (e.g., batch save, batch delete)
- User can see all messages before they disappear
- More informative UI

### Considerations
- **Screen Real Estate:** 3 stacked snackbars take significant space
- **Complexity:** Much more complex state management
- **Performance:** More components rendering simultaneously
- **UX Debate:** May clutter screen, goes against Material Design
- **Alternative:** Use notification center/drawer for message history

### Alternative Approaches

**Option A: Increase Individual Durations**
- Keep current architecture (one at a time)
- Increase durations: Success 6s, Error 8s, Warning 7s
- Simpler, less risk
- Estimated: 1 hour

**Option B: Toast History Drawer**
- Keep snackbars one at a time
- Add "notification history" icon in header
- Tap to see last 10 messages
- Best of both worlds
- Estimated: 1 day

---

## Recommendation

### For v2.1 Planning:

**High Priority:**
- ✅ Feature 1 (Manual Close for Actions) - 1 day
  - Directly addresses user feedback
  - Low complexity, high value
  - Doesn't change core architecture

**Low Priority:**
- ⏸️ Feature 2 (Vertical Stacking) - 2-3 days
  - High complexity, architectural change
  - Goes against Material Design guidelines
  - Consider alternatives first (Option A or B)

**Suggested v2.1 Scope:**
1. Feature 1: Manual close for action snackbars (1 day)
2. Option B: Toast history drawer (1 day)
3. Total: 2 days instead of 3-4 days for full stacking

---

## Decision Log

**Date:** October 22, 2025
**Sprint:** 1 Day 2
**Decision:** Defer to v2.1
**Rationale:**
- Focus on migration (113 Alert.alert calls remaining)
- Current implementation follows industry standards
- Can iterate on UX after migration complete
- Low severity issues, workarounds available

**Signed Off By:** Utpal (Tester) + Claude (Developer)

---

## References

- Material Design Snackbar Guidelines: https://m2.material.io/components/snackbars
- User Testing Results: SNACKBAR_TEST_CHECKLIST.md
- Sprint 1 Plan: V2.0_SPRINT_1_SNACKBAR_PLAN.md
