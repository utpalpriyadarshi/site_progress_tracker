# Snackbar & Dialog Test Checklist

## How to Access Test Screen

1. **Login as Admin:**
   - Username: `admin`
   - Password: `admin123`

2. **Navigate to Test Tab:**
   - Look for the 🧪 (Test) tab in the bottom navigation
   - Tab title: "Snackbar & Dialog Tests"

3. **Run Tests:**
   - Follow the checklist below
   - Test on both iOS and Android if possible

---

## Test Checklist

### ✅ Snackbar Type Tests

Test all 4 snackbar types to verify colors and auto-dismiss:

- [ok ] **Success Snackbar (Green)**
  - Click "Success Snackbar (Green)" button
  - Expected: Green snackbar at bottom
  - Message: "Item saved successfully!"
  - Auto-dismiss: 4 seconds
  - Color: #4CAF50 (green)

- [ok ] **Error Snackbar (Red)**
  - Click "Error Snackbar (Red)" button
  - Expected: Red snackbar at bottom
  - Message: "Failed to save item"
  - Auto-dismiss: 6 seconds (longer than success)
  - Color: #F44336 (red)

- [ok ] **Warning Snackbar (Orange)**
  - Click "Warning Snackbar (Orange)" button
  - Expected: Orange snackbar at bottom
  - Message: "Baseline is locked"
  - Auto-dismiss: 5 seconds
  - Color: #FF9800 (orange)

- [ok ] **Info Snackbar (Blue)**
  - Click "Info Snackbar (Blue)" button
  - Expected: Blue snackbar at bottom
  - Message: "Please select a site first"
  - Auto-dismiss: 5 seconds
  - Color: #2196F3 (blue)

### ✅ Snackbar Behavior Tests

- [See observation ] **Snackbar with Undo Action**
  - Click "Snackbar with Undo Action" button
  - Expected: Green snackbar with "UNDO" button on right
  - Message: "Item 1 deleted"
  - Counter should increment: "Items deleted with undo: 1"
  - Click "UNDO" button
  - Expected: New green snackbar "Item 1 restored"
  - Counter should decrement: "Items deleted with undo: 0"

Observations:Snackbar with undo action is not desirable as it is closing after timeout, it should be permanent with manual close button. 

- [See observations ] **Queue 4 Messages**
  - Click "Queue 4 Messages" button
  - Expected: 4 messages appear one after another
  - Order: Info → Success → Warning → Error
  - Messages: "First message" → "Second message" → "Third message" → "Fourth message"
  - No overlap - each waits for previous to dismiss
  Onservations:- All the message are quikly displaying not giving time for user to see, messages should be stacked vericallay and disappear one by one.

- [ok ] **Long Message**
  - Click "Long Message" button
  - Expected: Blue snackbar with long text
  - Text should be readable (not cut off)
  - Auto-dismiss: 5 seconds
  - Message wraps to multiple lines if needed

- [ok ] **10 Second Duration**
  - Click "10 Second Duration" button
  - Expected: Blue snackbar stays visible for 10 seconds
  - Message: "This message will show for 10 seconds"
  - Time it - should be approximately 10 seconds

### ✅ Dialog Tests

- [ok ] **Simple Dialog**
  - Click "Simple Dialog" button
  - Expected: Modal dialog appears with backdrop
  - Title: "Confirm Action"
  - Message: "This is a simple confirmation dialog. Do you want to continue?"
  - Buttons: "NO" (gray) and "YES" (blue)
  - Click "YES"
  - Expected: Dialog dismisses, green snackbar "Confirmed!"
  - Try again, click "NO"
  - Expected: Dialog dismisses, no snackbar

- [ok ] **Destructive Dialog (Red Button)**
  - Click "Destructive Dialog (Red Button)" button
  - Expected: Modal dialog appears
  - Title: "Delete Item"
  - Message: "Are you sure you want to delete this item? This action cannot be undone."
  - Buttons: "CANCEL" (gray) and "DELETE" (RED)
  - Confirm button should be red (#F44336)
  - Click "DELETE"
  - Expected: Dialog dismisses, green snackbar "Item deleted"

- [ok ] **Async Dialog (Loading State)**
  - Click "Async Dialog (Loading State)" button
  - Expected: Modal dialog appears
  - Title: "Lock Baseline"
  - Message: "This operation will take a few seconds. The confirm button will show a loading spinner."
  - Click "LOCK"
  - Expected: Button shows loading spinner for 2 seconds
  - Both buttons disabled during loading
  - After 2 seconds: Dialog dismisses, green snackbar "Async operation completed"

- [ok ] **Dialog Backdrop Dismiss**
  - Click any dialog button
  - Instead of clicking buttons, tap outside the dialog (on the backdrop)
  - Expected: Dialog dismisses (same as clicking cancel)

### ✅ Real-World Scenario Tests

- [ok ] **Save with Validation (Random)**
  - Click "Save with Validation (Random)" button multiple times
  - Expected: Random behavior (50/50 chance):
    - **Validation Fail:** Orange snackbar "Please fill in all required fields" (immediate)
    - **Validation Pass → Success:** Green snackbar "WBS item "Foundation Work" saved" (after 0.5s)
    - **Validation Pass → Error:** Red snackbar "Failed to save: Network timeout" (after 0.5s)
  - Click 5-10 times to see different outcomes

### ✅ Visual Tests

- [ok but see observation ] **Snackbar Position**
  - Snackbar appears at bottom of screen
  - Has margin from bottom edge (~20px)
  - Doesn't cover bottom navigation tabs, observations:- It is covering navigation tabs
  - Centered horizontally

- [ok ] **Text Readability**
  - White text on colored backgrounds
  - Text is readable on all 4 colors (green, red, orange, blue)
  - No text clipping

- [ok but see observation ] **Button Visibility**
  - Action button (UNDO) is visible on right side
  - Button text is readable
  - Button is thumb-friendly (easy to tap)

- [ok ] **Dialog Appearance**
  - Dialog is centered on screen
  - Backdrop darkens background
  - Dialog has rounded corners
  - Text is readable

- [ok ] **Animations**
  - Snackbar slides up from bottom (smooth)
  - Snackbar slides down when dismissed (smooth)
  - Dialog fades in (smooth)
  - Dialog fades out (smooth)

### ✅ Platform-Specific Tests

**Android:**
- [ok ] Snackbar renders correctly
- [ok ] Dialog renders correctly
- [ok ] Back button dismisses dialog
- [ok ] Animations are smooth
- [ok ] Colors match design

**iOS:**
- [ ] Snackbar renders correctly
- [ ] Dialog renders correctly
- [ ] Swipe down dismisses dialog (if applicable)
- [ ] Animations are smooth
- [ ] Colors match design

### ✅ Edge Cases

- [ok ] **Rapid Clicking**
  - Click "Success Snackbar" button 10 times rapidly
  - Expected: All 10 messages queue and show sequentially
  - No crashes or visual glitches

- [ok ] **Queue During Dialog**
  - Open a dialog
  - While dialog is open, trigger snackbar from another screen (if possible)
  - Expected: Snackbar shows behind dialog or queues until dialog dismisses

- [ ] **Rotate Device** (if applicable)
  - Show a snackbar
  - Rotate device
  - Expected: Snackbar repositions correctly
  - No crashes

- [ok ] **Background/Foreground**
  - Show a snackbar
  - Send app to background
  - Return to app
  - Expected: Snackbar is gone (auto-dismissed)
  - No crashes

---

## Bug Reporting

If you find any issues, document them here:

### Issue Template:

```
**Issue:** [Brief description]
**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Platform:** Android / iOS
**Severity:** Critical / High / Medium / Low
**Screenshot:** [If applicable]
```

### Known Issues:

**Issue #1: Snackbar covers navigation tabs** ✅ FIXED
- **Severity:** Medium
- **Fix Applied:** Increased marginBottom from 20px to 60px
- **Status:** Fixed in SnackbarProvider.tsx
- **Retest:** Reload app to verify

**Issue #2: Undo action auto-closes** ⏸️ DEFERRED to v2.1
- **Severity:** Low
- **Observation:** Snackbar with undo action closes after timeout
- **Request:** Should be permanent with manual close button
- **Decision:** Deferred - follows Material Design guidelines
- **Workaround:** Use Dialog for critical confirmations requiring user action
- **Rationale:**
  - Current behavior follows industry standards
  - Snackbars meant to be temporary, non-blocking
  - For permanent actions, use Dialog instead
  - Won't delay v2.0 migration (113 Alert.alert calls to replace)

**Issue #3: Queue messages too fast** ⏸️ DEFERRED to v2.1
- **Severity:** Low
- **Observation:** 4 queued messages show sequentially (one at a time)
- **Request:** Should stack vertically and all be visible at once
- **Decision:** Deferred - requires architecture redesign
- **Workaround:** Adjust durations or use Dialog for critical messages
- **Rationale:**
  - Current behavior follows Material Design guidelines
  - Stacking would require 2-3 days additional work
  - Snackbars are for FYI messages, not critical alerts
  - Can iterate on UX after migration complete

---

## Test Results

### Test Session 1:
- **Date:** _22-10-2025____________
- **Tester:** Utpal_____________
- **Platform:** Android / iOS
- **Tests Passed:** _____ / 35
- **Tests Failed:** _____
- **Notes:** See observations, all tests passed but some changes desired

---

## Sign-off

Once all tests pass:

- [ ] All 35 test cases passed
- [ ] No critical bugs found
- [ ] Documentation reviewed
- [ ] Ready to proceed with migration

**Tested by:** _______________
**Date:** _______________
**Approved by:** _______________

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark Sprint 1 Day 2 as complete
2. 🚀 Begin migration (Day 3-5)
3. 📝 Start with Tier 1 files (WBSManagementScreen.tsx - 9 alerts)

If issues found:
1. 🐛 Fix critical bugs first
2. 🧪 Retest affected areas
3. 📝 Update documentation
4. ✅ Sign off when ready
