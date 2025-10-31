# Planning Module Quick Start Guide

**Version:** v1.4 (Baseline Planning)
**Time to Read:** 3 minutes

---

## 🚀 Quick Start (5 Steps)

### 1️⃣ Select Project
Tap **"Choose Project"** → Select from dropdown

### 2️⃣ Review Items
View all items with current planned dates

### 3️⃣ Set Dependencies
Tap **"Manage"** → Check items that must complete first → **Save**

### 4️⃣ Calculate Critical Path
Tap **"Calculate Critical Path"** → Review results

### 5️⃣ Lock Baseline
Tap **"Lock Baseline"** → Confirm

**Done!** ✅ Your baseline plan is saved.

---

## 📋 Visual Guide

### Item Card Components

```
┌─────────────────────────────────────┐
│ Foundation             🔴 Critical  │  ← Title & Critical Path Indicator
│                        🔒 Locked    │  ← Lock Status
│                                     │
│ Duration: 5 days                    │  ← Calculated duration
│ Status: in progress                 │  ← Current status
│                                     │
│ Start: Jan 1, 2025      📅          │  ← Editable (if not locked)
│ End: Jan 5, 2025        📅          │  ← Editable (if not locked)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Baseline: Jan 1 - Jan 5    +2d │ │  ← Baseline info (blue)
│ └─────────────────────────────────┘ │
│                                     │
│ Dependencies: 2         [Manage]   │  ← Dependency management
└─────────────────────────────────────┘
```

### Color Coding

- 🔴 **Red Border** = Critical Path (delays affect project)
- 🟦 **Blue Bar** = Baseline dates (locked reference)
- 🟢 **Green Text** = Ahead of schedule
- 🔴 **Red Text** = Behind schedule
- 🟠 **Orange Chip** = Baseline locked

---

## ⚡ Essential Actions

### Edit a Date (if not locked)
1. Tap the date field
2. Select new date from picker
3. Automatically saves

### Add Dependencies
1. Tap **"Manage"** on item card
2. Check predecessor items
3. Tap **"Save"**

### Remove Dependencies
1. Tap **"Manage"**
2. Uncheck items
3. Tap **"Save"**

### Search Dependencies
1. In dependency modal
2. Type in search bar
3. Results filter automatically

---

## ⚠️ Important Rules

### ❌ Cannot Do When Baseline Locked:
- Edit dates directly
- Change dependencies
- Unlock easily

### ✅ Can Still Do When Locked:
- View all information
- Calculate critical path
- Make revisions (Phase 6 - Schedule Update screen)

### 🚫 Circular Dependencies Not Allowed:
```
❌ Wrong:
A depends on B
B depends on C
C depends on A  ← Circular!

✅ Correct:
A depends on B
B depends on C
C is independent
```

---

## 🎯 Critical Path Explained

### What is Critical Path?

The **longest** sequence of dependent tasks.

**Example:**
```
Path 1: A (5d) → B (10d) → C (7d) = 22 days ← Critical Path
Path 2: D (3d) → E (4d) = 7 days
```

**Result:** Project takes 22 days (determined by Path 1)

### Why It Matters

- **Critical tasks** (A, B, C) cannot be delayed without delaying the project
- **Non-critical tasks** (D, E) have 15 days of "slack" (can be delayed)
- Focus resources on critical tasks

### Visual Indicators

- Red borders = Critical path items
- Blue card = Summary of critical path results

---

## 📊 Variance Explained

### What is Variance?

Difference between **baseline** and **current** dates.

### How to Read Variance

| Display | Meaning | Action |
|---------|---------|--------|
| **+3 days** (red) | 3 days behind | Speed up or allocate resources |
| **-2 days** (green) | 2 days ahead | Great! Can start next task early |
| **0 days** | On schedule | Keep going as planned |

### Example

```
Baseline: Jan 1-10 (locked)
Planned:  Jan 1-13 (revised)
Variance: +3 days (delayed)
```

---

## 🔧 Quick Troubleshooting

### Problem: Can't edit dates
**Solution:** Baseline is locked → Use Schedule Update screen (Phase 6)

### Problem: Circular dependency error
**Solution:** Review dependency chain, remove one link

### Problem: Critical path button disabled
**Solution:** Add some dependencies first

### Problem: Items not loading
**Solution:** Ensure project has items added to sites

### Problem: Can't lock baseline
**Solution:** Already locked (check for orange warning card)

---

## 💡 Pro Tips

### Before Locking Baseline:
1. ✅ Set realistic durations (include buffers)
2. ✅ Define all major dependencies
3. ✅ Calculate critical path
4. ✅ Get stakeholder approval
5. ✅ Double-check all dates

### After Locking Baseline:
1. ✅ Monitor critical path items closely
2. ✅ Track variance weekly
3. ✅ Use Schedule Update for changes
4. ✅ Communicate delays proactively

### Dependency Best Practices:
- Start with major dependencies only
- Use logical Finish-to-Start relationships
- Don't over-constrain (too many dependencies)
- Keep it simple

---

## 📱 Screen Navigation

### Planning Module Tabs (Bottom Navigation)

```
┌─────────┬─────────┬─────────┬─────────┐
│ Baseline│  Gantt  │Analytics│Revisions│
│   📋    │   📊    │   📈    │   🔄    │
└─────────┴─────────┴─────────┴─────────┘
    ↑
 You are here
```

**Current:** Baseline Planning (Phase 3 - Complete)
**Coming:** Gantt Chart, Analytics, Revisions (Phases 4-6)

---

## 🎓 Learning Path

### Beginner (First Time)
1. Read Quick Start (this doc)
2. Select a small project (5-10 items)
3. Add a few dependencies
4. Calculate critical path
5. **Don't lock yet** - practice first

### Intermediate (Ready to Use)
1. Read User Guide (detailed)
2. Plan real project
3. Set all dependencies
4. Calculate critical path
5. Lock baseline
6. Monitor variance

### Advanced (Power User)
1. Read Implementation docs
2. Optimize schedules
3. Analyze critical paths
4. Use variance for forecasting
5. Train others

---

## 📚 Documentation Index

| Document | Purpose | Time |
|----------|---------|------|
| **Quick Start** (this) | Get started fast | 3 min |
| **User Guide** | Comprehensive instructions | 30 min |
| **Testing Plan** | Verify functionality | 4-6 hrs |
| **Implementation Status** | Technical details | 15 min |

---

## 🆘 Need Help?

### Quick Help
- Look for **ⓘ info icons** in the app
- Read error messages carefully
- Check this Quick Start guide

### Detailed Help
- Refer to **User Guide** for step-by-step instructions
- Check **Troubleshooting** section
- Contact your system administrator

### Report Issues
- Use Testing Plan bug report template
- Include screenshots if possible
- Note device and OS version

---

## ✅ Checklist: Your First Baseline

Use this checklist for your first baseline planning session:

```
Pre-Planning:
□ Project created
□ Sites added
□ Items added with planned dates

Planning:
□ Opened Baseline screen
□ Selected project
□ Reviewed all items
□ Set dependencies (at least major ones)
□ Calculated critical path
□ Reviewed critical items
□ Adjusted dates if needed

Baseline Lock:
□ Verified all dates correct
□ Confirmed dependencies logical
□ Read lock confirmation carefully
□ Locked baseline
□ Verified lock (orange card visible)
□ Tested that dates are now read-only

Post-Lock:
□ Communicated plan to team
□ Set up monitoring process
□ Know how to track variance
□ Understand revision process (Phase 6)
```

---

## 🎯 Success Criteria

You've mastered baseline planning when you can:

- ✅ Select projects and load items
- ✅ Set dependencies without errors
- ✅ Understand critical path results
- ✅ Lock baseline confidently
- ✅ Read and interpret variance
- ✅ Know when to use each feature

---

**Ready to start?** Open the app and follow the 5-step Quick Start! 🚀

**Questions?** Check the User Guide for detailed explanations.

**Found a bug?** Use the Testing Plan to report it properly.

---

**Phases Complete:** 1-3 (43% of Planning Module)
**Next Phase:** Enhanced Gantt Chart (Phase 4)
