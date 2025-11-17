# Phase 3 Day 1 - Complete Testing Instructions

**Created:** November 14, 2025
**Feature:** DOORS Package Editing (Phase 3.1A)
**Estimated Time:** 20 minutes

---

## 🎯 **What You're Testing**

We've implemented the **DOORS Package Edit** feature that allows users to:
- Edit package details (name, category, type, status, priority, quantity)
- View compliance summary
- See audit trail (who edited, when)
- Permission-based editing (Supervisors can edit approved packages, regular users only drafts)

---

## 📋 **Pre-Testing Setup**

### **Step 1: Rebuild the App** ⏱️ 3-5 min

**IMPORTANT:** Schema migration v27 requires app rebuild.

```bash
# 1. Stop the app if running (Ctrl+C in terminal)

# 2. Clear cache and rebuild
npm start -- --reset-cache

# 3. Wait for "Bundling complete"

# 4. On Android: Press 'a' to open on Android emulator
#    On iOS: Press 'i' to open on iOS simulator
```

**Expected:**
- ✅ App builds successfully
- ✅ No red error screens
- ✅ Login screen appears
Observation:- All ok
---

### **Step 2: Login** ⏱️ 30 sec

```
Email: logistics@test.com
Password: test123
```

**Expected:**
- ✅ Login successful
- ✅ Logistics Dashboard appears
Observation:- Login succesfful through normal login process, not through Email
---

### **Step 3: Navigate to DOORS** ⏱️ 15 sec

1. Tap bottom tab: **"DOORS"** (📋 icon)

**Expected:**
- ✅ DOORS Register screen appears
- ✅ Shows 5 demo packages (if demo data loaded)
- ✅ Each package card has a **pencil icon (✏️)** in top-right corner

**Screenshot:** Take a screenshot showing the pencil icons on cards
Observation: Screenshot @prompts\Edit1.png is attached, Pencil icon is available on each card, refer screenshot.
---

## ✅ **Quick Test Cases** (10 tests, ~15 min)

### **Test 1: Open Edit Screen** ⏱️ 1 min

1. Tap the **pencil icon ✏️** on any package card (e.g., "Auxiliary Transformer")

**Expected:**
- ✅ Edit screen opens
- ✅ Shows "Edit Package" title at top
- ✅ "Cancel" button (top-left)
- ✅ "Save" button (top-right, blue)
- ✅ All fields populated with current values
- ✅ No errors

**If fails:** Check console for errors, report them
Observation:- Svave button is grey and inactive, One additional message, "You dont have permission to edit this package, status under_review
Test Result:- All pass
---

### **Test 2: Edit Equipment Name** ⏱️ 2 min

1. Tap "Equipment Name" field
2. Change text to: `"Updated Transformer 1500kVA"`
3. Tap **Save** button
4. Wait for alert

**Expected:**
- ✅ Alert appears: "Package updated successfully"
- ✅ Tap "OK"
- ✅ Returns to DOORS Register
- ✅ Package card shows new name: "Updated Transformer 1500kVA"

**Screenshot:** After save, showing updated name on card
Observation:- After edit still shows the previous text.
---

### **Test 3: Change Category** ⏱️ 1 min

1. Open same package for editing (tap ✏️)
2. Tap a **different category pill** (e.g., OHE instead of TSS)
   - Selected pill turns blue
3. Tap **Save**

**Expected:**
- ✅ Pill highlights in blue when tapped
- ✅ Save succeeds
- ✅ Package card shows new category

**Screenshot:** Edit screen with blue highlighted pill
Observation:- No chnge of category
---

### **Test 4: Change Status to "Under Review"** ⏱️ 1 min

1. Open package for editing
2. Tap **"UNDER REVIEW"** status pill
3. Tap **Save**

**Expected:**
- ✅ Save succeeds
- ✅ Package card shows "UNDER REVIEW" badge (blue color)
Observation:- No change in Package card
---

### **Test 5: Change Priority** ⏱️ 1 min

1. Open package for editing
2. Tap **"HIGH"** priority pill
3. Tap **Save**

**Expected:**
- ✅ Save succeeds
- ✅ Package card shows "HIGH" priority badge (red color)
Observation:- No change in priority badge
---

### **Test 6: Edit Quantity** ⏱️ 1 min

1. Open package for editing
2. Change **Quantity** to: `10`
3. Tap **Save**

**Expected:**
- ✅ Save succeeds
- ✅ Package card shows "Qty: 10 nos"
Observation:- No change in qty
---

### **Test 7: Validation - Empty Name** ⏱️ 1 min

1. Open package for editing
2. **Delete all text** from Equipment Name field
3. Tap **Save**

**Expected:**
- ✅ Alert appears: "Validation failed: Equipment name is required"
- ✅ Does NOT save
- ✅ Stays on edit screen

**Screenshot:** Validation error alert
Observation:- Validation Passed
---

### **Test 8: Validation - Zero Quantity** ⏱️ 1 min

1. Change **Quantity** to: `0`
2. Tap **Save**

**Expected:**
- ✅ Alert: "Validation failed: Quantity must be greater than 0"
- ✅ Does NOT save
Observation:- Validation failed
---

### **Test 9: Cancel Button** ⏱️ 1 min

1. Open package for editing
2. Change Equipment Name
3. Tap **Cancel** (top-left)

**Expected:**
- ✅ Dialog: "Discard Changes?"
- ✅ Shows "Keep Editing" and "Discard" buttons

4. Tap **"Discard"**

**Expected:**
- ✅ Returns to Register
- ✅ Changes NOT saved

**Screenshot:** Discard confirmation dialog
Observation:- OK
---

### **Test 10: Permission - Approved Package** ⏱️ 2 min

**Setup:**
1. First change a package status to **"APPROVED"** (edit and select Approved status)
2. Save and return to Register

**Test:**
3. Tap ✏️ on the APPROVED package

**Expected:**
- ✅ Edit screen opens
- ✅ **Warning banner** at top: "⚠️ You don't have permission to edit this package. Status: approved"
- ✅ All fields are **grayed out** (disabled)
- ✅ **Save button is grayed out** (disabled)
- ✅ Cannot tap pills or edit fields

**Screenshot:** Permission denied screen with warning banner
Observation:- OK, Passed
---

## 📊 **Results Template**

Copy and fill this out:

```
## Phase 3 Day 1 Test Results

**Tester:** [Your Name]
**Date:** November 14, 2025
**Device:** [Android/iOS]
**Time:** [Total minutes]

### Test Results
- Test 1 (Open Edit): ✅ / ❌--
- Test 2 (Edit Name): ✅ / ❌--
- Test 3 (Category): ✅ / ❌--
- Test 4 (Status): ✅ / ❌--
- Test 5 (Priority): ✅ / ❌--
- Test 6 (Quantity): ✅ / ❌--
- Test 7 (Validation Empty): ✅ / ❌--
- Test 8 (Validation Zero): ✅ / ❌--
- Test 9 (Cancel): ✅ / ❌--
- Test 10 (Permission): ✅ / ❌--

**Pass Rate:** X/10 (XX%)

### Issues Found
1. [Issue description - or "None"]

### Screenshots
- [Number] screenshots attached
```

---

## 🐛 **What to Report**

### **High Priority Issues:**
- App crashes
- Cannot save edits
- Edits don't persist
- Can edit approved packages (permission bypass)
- Validation not working

### **Medium Priority:**
- UI glitches
- Wrong error messages
- Audit trail not showing

### **Low Priority:**
- Minor styling issues
- Typos

---

## 🎓 **Tips**

1. **Take screenshots** of each major step
2. **Watch console** for errors (if you have access)
3. **Test different packages** (not just one)
4. **Try edge cases** (very long names, special characters)
5. **Navigate away and back** to verify changes persist

---

## ✅ **Success Criteria**

**Ready to proceed to Day 2 if:**
- ✅ 9/10 or 10/10 tests passing
- ✅ No high priority issues
- ✅ Edits persist after navigation

**Need fixes if:**
- ❌ <9 tests passing
- ❌ Any high priority issues
- ❌ Edits not persisting

---

## 📝 **Bonus Tests** (Optional)

If you have extra time:

### **Bonus 1: Compliance Display** ⏱️ 30 sec
1. Open edit screen
2. Scroll to "Compliance Summary"
3. Verify shows: Total Requirements, Compliant count, Compliance %

### **Bonus 2: Audit Trail** ⏱️ 30 sec
1. After editing, open package again
2. Scroll to bottom
3. Check "Last Modified" section shows timestamp

### **Bonus 3: Multiple Edits** ⏱️ 1 min
1. Edit package
2. Save
3. Edit same package again
4. Save again
5. Verify both edits persist

---

## 🚀 **After Testing**

1. **Report results** using the template above
2. **Attach screenshots**
3. **List any issues** found

Then we can:
- **Fix issues** if needed
- **Proceed to Day 2** (Requirement Edit Screen)

---

**Questions?** Ask before starting!

---

**End of Testing Instructions**
