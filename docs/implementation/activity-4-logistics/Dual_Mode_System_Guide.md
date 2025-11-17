# Dual-Mode System Guide
**Activity 4 - Logistics Implementation**
**Feature**: Demo Mode vs Production Mode
**Date**: November 2025
**Status**: Implemented

---

## 📋 **Overview**

The Material Tracking system now supports **two operational modes** to accommodate both **testing/demonstration** scenarios and **real production usage**.

### **Why Two Modes?**

The system needed to support:
1. **Testing & Demonstrations**: Load sample data, test features, create screenshots, training
2. **Real Project Work**: Use actual BOMs created by Project Manager for projects like AEP 01

Without mode separation, the system would either:
- Auto-load fake data in production (bad for real projects)
- Never show the empty state in development (bad for testing)

---

## 🎯 **Mode Comparison**

| Feature | Demo Mode 🧪 | Production Mode 🏗️ |
|---------|-------------|-------------------|
| **Purpose** | Testing, demos, training | Real project operations |
| **Data Source** | Mock Metro Railway BOMs | BOMs created by PM |
| **Empty State** | Shows "Load Sample BOMs" button | Shows "Contact PM" message |
| **Auto-Loading** | No auto-loading | Loads real BOMs automatically |
| **When to Use** | Development, testing, demos | Real projects (AEP 01, etc.) |
| **Mode Indicator** | Shows "🧪 DEMO" badge | Shows "🏗️ PROD" badge |

---

## 🔧 **How It Works**

### **1. Mode Detection**

```typescript
// src/config/AppMode.ts
class AppModeConfig {
  private detectInitialMode(): AppModeType {
    if (__DEV__) {
      // In development, default to demo mode
      return 'demo';
    }
    // Production builds always use production mode
    return 'production';
  }
}
```

**Logic**:
- **Development builds** (`__DEV__ = true`): Default to **Demo Mode**
- **Production builds** (`__DEV__ = false`): Always use **Production Mode**
- Users can toggle modes in development for testing

### **2. BomDataService Behavior**

```typescript
// src/services/BomDataService.ts
async getBoms(options: BomDataOptions = {}): Promise<BomModel[]> {
  const bomsList = await query.fetch();
  const mode = AppMode.getMode();

  if (bomsList.length === 0) {
    if (mode === 'demo') {
      // Demo Mode: Show empty state, wait for button click
      return [];
    } else if (mode === 'production') {
      // Production Mode: No BOMs means PM hasn't created any yet
      return [];
    }
  }

  return bomsList;
}
```

**Key Points**:
- No automatic mock data loading in either mode
- Empty state behavior depends on mode
- User explicitly loads sample data in demo mode

### **3. Material Tracking Screen**

**Demo Mode Empty State**:
```
📋 No Bills of Materials (BOMs)

To track materials, you need Bills of Materials (BOMs) from the Project Manager.

[📊 Load Sample Metro Railway BOMs]  ← Button visible

Sample data includes: Civil Works, OCS Installation...
```

**Production Mode Empty State**:
```
📋 No Bills of Materials (BOMs)

To track materials, you need Bills of Materials (BOMs) from the Project Manager.

💼 Contact your Project Manager to create BOMs for this project.

BOMs are created by the Project Manager and will automatically appear here once added.
```

---

## 🎮 **Using Demo Mode**

### **For Testing (Manual Test Scenario 1)**

1. **Start the app in development mode**
   ```bash
   npm start
   ```

2. **Open Material Tracking screen**
   - App defaults to Demo Mode
   - See mode indicator: **🧪 DEMO** in top-right corner

3. **Verify Empty State**
   - See large 📋 icon
   - See "No Bills of Materials (BOMs)" title
   - See description explaining workflow
   - See **blue button**: "📊 Load Sample Metro Railway BOMs"
   - See hint text about sample data

4. **Click Load Sample BOMs Button**
   - Button shows loading spinner
   - Wait ~1 second
   - Screen refreshes with 5 BOMs loaded (37 materials)
   - Stats cards appear
   - Category filters become active

5. **Test All Features**
   - Test category filters (Civil, OCS, Electrical, Signaling, MEP)
   - Test search functionality
   - Test view mode tabs
   - All features work with sample data

### **Toggling Modes (Development Only)**

1. **Tap the mode indicator** in the top-right corner
   - **🧪 DEMO** → switches to → **🏗️ PROD**
   - **🏗️ PROD** → switches to → **🧪 DEMO**

2. **Screen refreshes** with new mode behavior

---

## 🏗️ **Using Production Mode**

### **For Real Projects (e.g., AEP 01)**

1. **Project Manager creates BOMs**
   - PM opens BOM Management screen
   - Creates BOM: "AEP 01 - Foundation Work"
   - Adds materials: Cement, Steel, Sand, etc.
   - Saves to database

2. **Logistics accesses Material Tracking**
   - Selects project: "AEP 01"
   - BOMs **automatically load** from database
   - No button click needed
   - Data flows seamlessly PM → Logistics

3. **If No BOMs Exist Yet**
   - Empty state shows: "💼 Contact your Project Manager..."
   - No "Load Sample BOMs" button
   - User knows to wait for PM to create BOMs

---

## 🔄 **Data Flow Architecture**

### **Demo Mode Flow**

```
User Opens Material Tracking
  ↓
BomDataService.getBoms() checks database
  ↓
No BOMs found
  ↓
Mode = Demo → Return empty array
  ↓
Empty state renders with "Load Sample BOMs" button
  ↓
User clicks button
  ↓
BomDataService.loadMockBoms() creates 5 Metro Railway BOMs
  ↓
Screen refreshes with sample data
  ↓
User can test all features
```

### **Production Mode Flow**

```
Project Manager creates BOMs
  ↓
BOMs saved to WatermelonDB
  ↓
Syncs to AWS AppSync (cloud)
  ↓
Logistics opens Material Tracking
  ↓
Selects project "AEP 01"
  ↓
BomDataService.getBoms() queries database
  ↓
BOMs found for project
  ↓
Returns real BOMs
  ↓
Material Tracking displays real data
  ↓
Logistics tracks materials, creates orders, schedules deliveries
```

---

## 📁 **Files Modified**

### **New Files**

1. **`src/config/AppMode.ts`**
   - AppModeConfig class
   - Mode detection logic
   - Mode toggle functionality
   - Behavior flags

### **Modified Files**

1. **`src/services/BomDataService.ts`**
   - Imported AppMode
   - Updated `getBoms()` for mode-based behavior
   - Removed automatic mock data loading

2. **`src/logistics/MaterialTrackingScreen.tsx`**
   - Imported AppMode
   - Added mode state tracking
   - Added mode indicator UI (🧪 DEMO / 🏗️ PROD)
   - Updated empty state for dual modes
   - Added `handleToggleMode()` function

---

## 🧪 **Testing Checklist**

### **Demo Mode Tests**

- [ ] App starts in Demo Mode by default (development)
- [ ] Mode indicator shows "🧪 DEMO" badge
- [ ] Empty state shows "Load Sample BOMs" button
- [ ] Button click loads 5 Metro Railway BOMs
- [ ] 37 material items appear
- [ ] Stats cards display data
- [ ] Category filters work
- [ ] Search functionality works
- [ ] Can toggle to Production Mode

### **Production Mode Tests**

- [ ] Can switch to Production Mode via indicator
- [ ] Mode indicator shows "🏗️ PROD" badge
- [ ] Empty state shows "Contact PM" message
- [ ] No "Load Sample BOMs" button visible
- [ ] Real BOMs created by PM appear automatically
- [ ] Can toggle back to Demo Mode

---

## 🎨 **UI Elements**

### **Mode Indicator Badge**

**Location**: Top-right corner of Material Tracking header

**Demo Mode**:
- Background: Orange tint (#FFF3E0)
- Border: Orange (#FF9800)
- Text: "🧪 DEMO"

**Production Mode**:
- Background: Green tint (#E8F5E9)
- Border: Green (#4CAF50)
- Text: "🏗️ PROD"

**Behavior**:
- Only visible in development (`__DEV__ = true`)
- Tappable to toggle modes
- Disappears in production builds

---

## 🔐 **Security & Best Practices**

### **Production Builds**

```typescript
// In production, mode indicator is hidden
{__DEV__ && (
  <TouchableOpacity onPress={handleToggleMode}>
    <Text>{appMode === 'demo' ? '🧪 DEMO' : '🏗️ PROD'}</Text>
  </TouchableOpacity>
)}
```

- Mode toggle is **development-only**
- Production builds always use Production Mode
- Users cannot switch to Demo Mode in production
- Prevents accidental mock data in real projects

### **Data Separation**

- Demo Mode uses `src/data/mockBOMs.ts`
- Production Mode uses real database records
- No cross-contamination
- Clear separation of concerns

---

## 🚀 **Benefits**

### **For Developers**

✅ Can properly test empty state
✅ Can test sample data loading
✅ Can switch modes on-the-fly
✅ Better development workflow
✅ Easier to create screenshots/demos

### **For Testers**

✅ Clear testing scenarios
✅ Can test both modes
✅ No confusion about data source
✅ Proper empty state testing
✅ Matches real-world usage

### **For End Users**

✅ No accidental mock data in production
✅ Clear instructions when no BOMs exist
✅ Seamless data flow from PM
✅ Professional experience

---

## 🐛 **Troubleshooting**

### **Issue: Can't see empty state in development**

**Solution**: Make sure you're in Demo Mode
- Check mode indicator: Should show "🧪 DEMO"
- If not, tap indicator to switch to Demo Mode
- Clear existing BOMs from database if needed

### **Issue: "Load Sample BOMs" button not working**

**Checklist**:
1. ✅ Project is selected from dropdown?
2. ✅ In Demo Mode (not Production Mode)?
3. ✅ Console shows loading logs?
4. ✅ Wait ~1 second for loading?

### **Issue: Mode indicator not visible**

**Reason**: Only shows in development
- Check `__DEV__` flag is true
- Only visible when running via `npm start`
- Not visible in production builds

---

## 📝 **Future Enhancements**

### **Potential Features**

1. **Persistent Mode Preference**
   - Save mode choice to AsyncStorage
   - Remember user's preferred mode
   - Restore on app restart

2. **Settings Screen Toggle**
   - Add mode toggle in Settings
   - More discoverable than header badge
   - Can add help text explaining modes

3. **Role-Based Defaults**
   - Logistics role → Production Mode
   - Developer role → Demo Mode
   - QA role → Demo Mode

4. **Mode-Specific Features**
   - Demo Mode: Add data reset button
   - Production Mode: Show sync status
   - Different analytics in each mode

---

## 📚 **Related Documentation**

- [Phase 1 Manual Testing Procedure](./Phase_1_Manual_Testing_Procedure.md)
- [BomDataService Documentation](../../services/BomDataService.ts)
- [AppMode Configuration](../../src/config/AppMode.ts)

---

**Status**: ✅ Implemented and Ready for Testing
**Version**: 1.0
**Last Updated**: November 6, 2025
