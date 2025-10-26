# Sprint 2 Testing - Sample Project Data

**Date:** October 24, 2025
**Sprint:** Sprint 2 - Search & Filtering (v2.1)
**Purpose:** Sample data for manual testing all 3 enhanced screens
**Status:** 🟢 **READY TO USE**

---

## 📋 Overview

This document provides complete sample data to create in your app for comprehensive testing of Sprint 2 features. Follow the sections in order to set up a realistic construction project scenario.

**Total Setup Time:** 20-30 minutes
**Data Created:**
- 1 Project
- 3 Sites
- 3 Categories
- 30 Items (mix of phases and statuses)
- WBS structure with critical path items

---

## 🏗️ Step 1: Create Project

**Navigation:** Admin → Project Management → Add Project

### Project 1: Mumbai Metro Line 3
```
Project Name: Mumbai Metro Line 3 - Underground Railway
Description: Construction of 33.5 km underground metro line with 27 stations
Start Date: January 1, 2024
End Date: December 31, 2026
Budget: ₹23,136 Crores, Obs:- Can take only $
Status: In Progress
```

---

## 🏢 Step 2: Create Sites

**Navigation:** Supervisor → Site Management → Add Site
**Note:** Assign all sites to your supervisor account

### Site 1: Colaba Station
```
Site Name: Colaba Station - South Terminal
Location: Mumbai, Colaba, Near Regal Cinema
Project: Mumbai Metro Line 3 - Underground Railway
Supervisor: [Your Supervisor ID]' Obs: I have one supervisor at the moment but ID I am not sure.
```

### Site 2: BKC Station
```
Site Name: BKC Station - Business District
Location: Mumbai, Bandra Kurla Complex, G Block
Project: Mumbai Metro Line 3 - Underground Railway
Supervisor: [Your Supervisor ID]
```

### Site 3: SEEPZ Station
```
Site Name: SEEPZ Station - Airport Link
Location: Mumbai, Andheri East, SEEPZ Industrial Area
Project: Mumbai Metro Line 3 - Underground Railway
Supervisor: [Your Supervisor ID]
```

---

## 📂 Step 3: Create Categories

**Navigation:** Admin → Category Management → Add Category
Obs: There is no Category Management in Admin
### Category 1: Civil Works
```
Category Name: Civil Works
Description: Foundation, excavation, concrete works
Icon: bulldozer
Color: Brown (#795548)
```

### Category 2: MEP
```
Category Name: MEP (Mechanical, Electrical, Plumbing)
Description: HVAC, electrical systems, plumbing
Icon: power-plug
Color: Orange (#FF9800)
```

### Category 3: Architectural Finishes
```
Category Name: Architectural Finishes
Description: Flooring, wall finishes, ceiling, painting
Icon: brush
Color: Purple (#9C27B0)
```

---

## 🔨 Step 4: Create Items for Site 1 (Colaba Station)

**Navigation:** Planning → WBS Management → Select "Colaba Station" → Add Item

### Items for COLABA STATION (10 items)

#### Item 1: Foundation Excavation
```
WBS Code: 1.0.0.0
Item Name: Foundation Excavation and Shoring
Category: Civil Works
Phase: Site Prep
Status: Completed
Planned Quantity: 5000
Completed Quantity: 5000
Unit: cubic_meters
Start Date: Jan 1, 2024
End Date: Mar 31, 2024
Duration: 90 days
Weightage: 10, Obs:-Not in WBS add item, should be available
Is Critical Path: Yes
Dependencies: None
```

#### Item 2: Base Slab Concrete
```
WBS Code: 1.1.0.0
Item Name: Base Slab Concrete Pouring
Category: Civil Works
Phase: Construction
Status: Completed
Planned Quantity: 1200
Completed Quantity: 1200
Unit: cubic_meters
Start Date: Apr 1, 2024
End Date: May 15, 2024
Duration: 45 days
Weightage: 8
Is Critical Path: Yes
Dependencies: 1.0.0.0
```

#### Item 3: Column Casting
```
WBS Code: 1.1.1.0
Item Name: Platform Level Column Casting
Category: Civil Works
Phase: Construction
Status: In Progress
Planned Quantity: 150
Completed Quantity: 100
Unit: cubic_meters
Start Date: May 16, 2024
End Date: Jul 31, 2024
Duration: 77 days
Weightage: 7
Is Critical Path: Yes
Dependencies: 1.1.0.0
```

#### Item 4: Roof Slab
```
WBS Code: 1.1.2.0
Item Name: Station Roof Slab Construction
Category: Civil Works
Phase: Construction
Status: Not Started
Planned Quantity: 2000
Completed Quantity: 0
Unit: square_meters
Start Date: Aug 1, 2024
End Date: Oct 31, 2024
Duration: 92 days
Weightage: 9
Is Critical Path: Yes
Dependencies: 1.1.1.0
```

#### Item 5: HVAC System
```
WBS Code: 2.0.0.0
Item Name: HVAC System Installation
Category: MEP
Phase: Construction
Status: Not Started
Planned Quantity: 1
Completed Quantity: 0
Unit: numbers (system)
Start Date: Sep 1, 2024
End Date: Dec 15, 2024
Duration: 106 days
Weightage: 6
Is Critical Path: No
Dependencies: 1.1.1.0
```

#### Item 6: Electrical Panels
```
WBS Code: 2.1.0.0
Item Name: Electrical Panel and Distribution
Category: MEP
Phase: Procurement
Status: In Progress
Planned Quantity: 12
Completed Quantity: 8
Unit: pieces
Start Date: Jun 1, 2024
End Date: Aug 30, 2024
Duration: 91 days
Weightage: 5
Is Critical Path: No
Dependencies: None
```

#### Item 7: Platform Flooring
```
WBS Code: 3.0.0.0
Item Name: Platform Granite Flooring
Category: Architectural Finishes
Phase: Construction
Status: Not Started
Planned Quantity: 3500
Completed Quantity: 0
Unit: square_meters
Start Date: Nov 1, 2024
End Date: Jan 31, 2025
Duration: 92 days
Weightage: 4
Is Critical Path: No
Dependencies: 1.1.2.0
```

#### Item 8: Wall Cladding
```
WBS Code: 3.1.0.0
Item Name: Station Wall Cladding and Panels
Category: Architectural Finishes
Phase: Design
Status: In Progress
Planned Quantity: 2500
Completed Quantity: 1000
Unit: square_meters
Start Date: May 1, 2024
End Date: Sep 30, 2024
Duration: 153 days
Weightage: 5
Is Critical Path: No
Dependencies: None
```

#### Item 9: Fire Safety System
```
WBS Code: 2.2.0.0
Item Name: Fire Detection and Suppression System
Category: MEP
Phase: Testing
Status: Not Started
Planned Quantity: 1
Completed Quantity: 0
Unit: numbers (system)
Start Date: Dec 1, 2024
End Date: Jan 15, 2025
Duration: 46 days
Weightage: 6
Is Critical Path: No
Dependencies: 2.0.0.0, 2.1.0.0
```

#### Item 10: Station Signage
```
WBS Code: 3.2.0.0
Item Name: Wayfinding and Station Signage
Category: Architectural Finishes
Phase: Commissioning
Status: Not Started
Planned Quantity: 150
Completed Quantity: 0
Unit: pieces
Start Date: Jan 1, 2025
End Date: Feb 15, 2025
Duration: 46 days
Weightage: 2
Is Critical Path: No
Dependencies: 3.0.0.0, 3.1.0.0
```

---

## 🔨 Step 5: Create Items for Site 2 (BKC Station)

**Navigation:** Planning → WBS Management → Select "BKC Station" → Add Item

### Items for BKC STATION (10 items)

#### Item 11: Site Mobilization
```
WBS Code: 1.0.0.0
Item Name: Site Mobilization and Setup
Category: Civil Works
Phase: Mobilization
Status: Completed
Planned Quantity: 1
Completed Quantity: 1
Unit: numbers (lot)
Start Date: Feb 1, 2024
End Date: Feb 29, 2024
Duration: 29 days
Weightage: 3
Is Critical Path: Yes
Dependencies: None
```

#### Item 12: Deep Excavation
```
WBS Code: 1.1.0.0
Item Name: Deep Excavation - 25m Depth
Category: Civil Works
Phase: Site Prep
Status: In Progress
Planned Quantity: 8000
Completed Quantity: 6000
Unit: cubic_meters
Start Date: Mar 1, 2024
End Date: Jun 30, 2024
Duration: 122 days
Weightage: 12
Is Critical Path: Yes
Dependencies: 1.0.0.0
```

#### Item 13: Diaphragm Wall
```
WBS Code: 1.1.1.0
Item Name: Diaphragm Wall Construction
Category: Civil Works
Phase: Construction
Status: In Progress
Planned Quantity: 500
Completed Quantity: 300
Unit: cubic_meters
Start Date: Mar 15, 2024
End Date: Jul 15, 2024
Duration: 123 days
Weightage: 10
Is Critical Path: Yes
Dependencies: 1.0.0.0
```

#### Item 14: Station Box Slab
```
WBS Code: 1.2.0.0
Item Name: Station Box Base Slab
Category: Civil Works
Phase: Construction
Status: Not Started
Planned Quantity: 2500
Completed Quantity: 0
Unit: cubic_meters
Start Date: Jul 1, 2024
End Date: Oct 31, 2024
Duration: 123 days
Weightage: 11
Is Critical Path: Yes
Dependencies: 1.1.0.0, 1.1.1.0
```

#### Item 15: Escalator Installation
```
WBS Code: 2.0.0.0
Item Name: Escalator Procurement and Installation
Category: MEP
Phase: Procurement
Status: In Progress
Planned Quantity: 6
Completed Quantity: 3
Unit: pieces
Start Date: Aug 1, 2024
End Date: Nov 30, 2024
Duration: 122 days
Weightage: 7
Is Critical Path: No
Dependencies: None
```

#### Item 16: Lift Installation
```
WBS Code: 2.1.0.0
Item Name: Passenger Lift System
Category: MEP
Phase: Procurement
Status: Not Started
Planned Quantity: 4
Completed Quantity: 0
Unit: pieces
Start Date: Sep 1, 2024
End Date: Dec 31, 2024
Duration: 122 days
Weightage: 6
Is Critical Path: No
Dependencies: None
```

#### Item 17: Platform Screen Doors
```
WBS Code: 2.2.0.0
Item Name: Automatic Platform Screen Doors
Category: MEP
Phase: Design
Status: In Progress
Planned Quantity: 24
Completed Quantity: 5
Unit: pieces
Start Date: Jun 1, 2024
End Date: Oct 31, 2024
Duration: 153 days
Weightage: 8
Is Critical Path: No
Dependencies: None
```

#### Item 18: Ceiling System
```
WBS Code: 3.0.0.0
Item Name: False Ceiling and Acoustic Panels
Category: Architectural Finishes
Phase: Design
Status: Not Started
Planned Quantity: 4000
Completed Quantity: 0
Unit: square_meters
Start Date: Nov 1, 2024
End Date: Jan 31, 2025
Duration: 92 days
Weightage: 4
Is Critical Path: No
Dependencies: 1.2.0.0
```

#### Item 19: Ticket Vending Machines
```
WBS Code: 2.3.0.0
Item Name: Ticket Vending Machine Installation
Category: MEP
Phase: Commissioning
Status: Not Started
Planned Quantity: 8
Completed Quantity: 0
Unit: pieces
Start Date: Jan 1, 2025
End Date: Jan 31, 2025
Duration: 31 days
Weightage: 3
Is Critical Path: No
Dependencies: 2.0.0.0, 2.1.0.0
```

#### Item 20: Station Testing
```
WBS Code: 4.0.0.0
Item Name: System Integration Testing
Category: MEP
Phase: Testing
Status: Not Started
Planned Quantity: 1
Completed Quantity: 0
Unit: numbers (test cycle)
Start Date: Feb 1, 2025
End Date: Mar 15, 2025
Duration: 43 days
Weightage: 5
Is Critical Path: Yes
Dependencies: 2.2.0.0, 2.3.0.0, 3.0.0.0
```

---

## 🔨 Step 6: Create Items for Site 3 (SEEPZ Station)

**Navigation:** Planning → WBS Management → Select "SEEPZ Station" → Add Item

### Items for SEEPZ STATION (10 items)

#### Item 21: Land Acquisition
```
WBS Code: 1.0.0.0
Item Name: Land Acquisition and Clearance
Category: Civil Works
Phase: Approvals
Status: Completed
Planned Quantity: 1
Completed Quantity: 1
Unit: numbers (lot)
Start Date: Dec 1, 2023
End Date: Jan 31, 2024
Duration: 62 days
Weightage: 4
Is Critical Path: Yes
Dependencies: None
```

#### Item 22: Environmental Clearance
```
WBS Code: 1.0.1.0
Item Name: Environmental Impact Assessment
Category: Civil Works
Phase: Approvals
Status: Completed
Planned Quantity: 1
Completed Quantity: 1
Unit: numbers (approval)
Start Date: Dec 1, 2023
End Date: Feb 15, 2024
Duration: 77 days
Weightage: 3
Is Critical Path: Yes
Dependencies: None
```

#### Item 23: TBM Setup
```
WBS Code: 1.1.0.0
Item Name: Tunnel Boring Machine Setup
Category: Civil Works
Phase: Mobilization
Status: In Progress
Planned Quantity: 2
Completed Quantity: 1
Unit: pieces
Start Date: Mar 1, 2024
End Date: Apr 30, 2024
Duration: 61 days
Weightage: 8
Is Critical Path: Yes
Dependencies: 1.0.0.0, 1.0.1.0
```

#### Item 24: Tunnel Excavation
```
WBS Code: 1.2.0.0
Item Name: Tunnel Excavation - 3.2 km
Category: Civil Works
Phase: Construction
Status: In Progress
Planned Quantity: 3200
Completed Quantity: 1800
Unit: linear_meters
Start Date: May 1, 2024
End Date: Dec 31, 2024
Duration: 245 days
Weightage: 15
Is Critical Path: Yes
Dependencies: 1.1.0.0
```

#### Item 25: Tunnel Lining
```
WBS Code: 1.2.1.0
Item Name: Concrete Tunnel Lining
Category: Civil Works
Phase: Construction
Status: In Progress
Planned Quantity: 2500
Completed Quantity: 1200
Unit: linear_meters
Start Date: May 15, 2024
End Date: Dec 31, 2024
Duration: 231 days
Weightage: 12
Is Critical Path: Yes
Dependencies: 1.2.0.0
```

#### Item 26: Track Laying
```
WBS Code: 2.0.0.0
Item Name: Railway Track Installation
Category: Civil Works
Phase: Construction
Status: Not Started
Planned Quantity: 3200
Completed Quantity: 0
Unit: linear_meters
Start Date: Jan 1, 2025
End Date: Apr 30, 2025
Duration: 120 days
Weightage: 10
Is Critical Path: Yes
Dependencies: 1.2.1.0
```

#### Item 27: Traction Power Supply
```
WBS Code: 2.1.0.0
Item Name: 25kV Traction Power System
Category: MEP
Phase: Design
Status: In Progress
Planned Quantity: 1
Completed Quantity: 0.4
Unit: numbers (system)
Start Date: Apr 1, 2024
End Date: Dec 31, 2024
Duration: 275 days
Weightage: 9
Is Critical Path: No
Dependencies: None
```

#### Item 28: Signaling System
```
WBS Code: 2.2.0.0
Item Name: Communication Based Train Control (CBTC)
Category: MEP
Phase: Procurement
Status: In Progress
Planned Quantity: 1
Completed Quantity: 0.3 // observation: decimal value input error
Unit: numbers (system)
Start Date: Jun 1, 2024
End Date: Feb 28, 2025
Duration: 272 days
Weightage: 11
Is Critical Path: No
Dependencies: None
```

#### Item 29: Emergency Exits
```
WBS Code: 3.0.0.0
Item Name: Emergency Exit Shafts
Category: Civil Works
Phase: Construction
Status: Not Started
Planned Quantity: 8
Completed Quantity: 0
Unit: pieces
Start Date: Aug 1, 2024
End Date: Dec 31, 2024
Duration: 153 days
Weightage: 6
Is Critical Path: No
Dependencies: 1.2.0.0
```

#### Item 30: SAT Preparation
```
WBS Code: 4.0.0.0
Item Name: Site Acceptance Test Preparation
Category: MEP
Phase: SAT
Status: Not Started
Planned Quantity: 1
Completed Quantity: 0
Unit: numbers (test)
Start Date: May 1, 2025
End Date: Jun 30, 2025
Duration: 61 days
Weightage: 7
Is Critical Path: Yes
Dependencies: 2.0.0.0, 2.1.0.0, 2.2.0.0
```

---

## 📊 Data Summary

### Summary by Site

| Site | Items | Critical Path | Completed | In Progress | Not Started |
|------|-------|--------------|-----------|-------------|-------------|
| Colaba Station | 10 | 4 | 2 | 3 | 5 |
| BKC Station | 10 | 4 | 1 | 5 | 4 |
| SEEPZ Station | 10 | 6 | 2 | 5 | 3 |
| **TOTAL** | **30** | **14** | **5** | **13** | **12** |

### Summary by Phase

| Phase | Count | Percentage |
|-------|-------|------------|
| Approvals | 2 | 7% |
| Mobilization | 2 | 7% |
| Site Prep | 2 | 7% |
| Procurement | 4 | 13% |
| Design | 4 | 13% |
| Construction | 11 | 37% |
| Testing | 2 | 7% |
| Commissioning | 2 | 7% |
| SAT | 1 | 3% |

### Summary by Status

| Status | Count | Percentage |
|--------|-------|------------|
| Completed | 5 | 17% |
| In Progress | 13 | 43% |
| Not Started | 12 | 40% |

### Summary by Category

| Category | Count |
|----------|-------|
| Civil Works | 18 |
| MEP | 11 |
| Architectural Finishes | 1 |

---

## 🎯 What This Data Enables You to Test

### Search Functionality
- **By Name:** Search "excavation", "concrete", "system", "platform"
- **By WBS Code:** Search "1.2", "2.0", "3" (hierarchical search)
- **By Location:** Search "Mumbai", "Colaba", "BKC", "SEEPZ"
- **By Keywords:** Search "tunnel", "electrical", "finish", "safety"

### Filter Testing
- **Status Filters:** 5 completed, 13 in progress, 12 not started
- **Phase Filters:** All 11 phases represented
- **Critical Path:** 14 items marked as critical path (47%)
- **Multi-Site:** 3 sites with 10 items each

### Sort Testing
- **By Name:** A-Z sorting (Automatic to Wayfinding)
- **By WBS Code:** Hierarchical sorting (1.0.0.0 to 4.0.0.0)
- **By Progress:** 0% to 100% range
- **By Duration:** 29 days to 275 days range
- **By Date:** Spanning Dec 2023 to Jun 2025

### Combined Filter Testing
- Search "construction" + Phase "Construction" + Status "In Progress" + Sort by Progress
- Search "1.2" (WBS) + Critical Path Only + Sort by WBS Code
- Search "MEP" + Phase "Procurement" + Status "In Progress"
- Site "Colaba" + Status "Not Started" + Sort by Start Date

### Performance Testing
- 30 total items (good for testing)
- 10 items per site (moderate load)
- Mix of simple and complex WBS codes
- Realistic construction project data

---

## 💡 Testing Tips

### Quick Data Entry Tips
1. **Use copy-paste:** Copy the data blocks directly from this doc
2. **Start with Site 1:** Create all 10 items for Colaba first
3. **Test as you go:** After creating 5-10 items, test search/filter
4. **Focus on variety:** Ensure good mix of statuses and phases
5. **Mark critical path:** Remember to check "Is Critical Path" for items marked Yes

### Data Entry Shortcuts
- **Dates:** Use consistent format (e.g., Jan 1, 2024)
- **Quantities:** Don't worry about exact numbers, close is fine
- **WBS Codes:** Follow the hierarchy strictly for proper testing
- **Dependencies:** Can be added later if time-consuming

### Minimum Viable Dataset
**Short on time? Create this minimum set:**
- Site 1: Items 1-5 (foundation to HVAC)
- Site 2: Items 11-15 (mobilization to escalator)
- Site 3: Items 21-24 (approvals to tunnel excavation)

**Total: 14 items across 3 sites** - Enough for basic testing

---

## ✅ Data Creation Checklist

### Pre-Testing Setup
- [ok ] 1 Project created (Mumbai Metro Line 3)
- [ok ] 3 Sites created (Colaba, BKC, SEEPZ)
- [No, at this time ] 3 Categories created (Civil Works, MEP, Architectural Finishes)
- [ok ] 30 Items created across all sites
  - [ok ] Site 1: 10 items (Colaba Station)
  - [ok ] Site 2: 10 items (BKC Station)
  - [ok ] Site 3: 10 items (SEEPZ Station)
- [ok ] Critical path items marked (14 total)
- [ok ] Status variety confirmed (5 completed, 13 in progress, 12 not started)
- [ok ] Phase variety confirmed (all 11 phases represented)

### Quick Verification
- [ok, one site at a time ] Can see all 3 sites in Site Management screen
- [ok ] Can see items when selecting each site in Items Management
- [ok ] Can see items in WBS Management for each site
- [ok ] Search "foundation" returns results
- [ok ] Filter by "In Progress" shows 13 items
- [ok ] Sort by WBS Code shows hierarchical order

---

## 🎉 Ready to Test!

Once you've created this data:
1. ✅ Open `SPRINT_2_DAY_6_TESTING_GUIDE.md`
2. ✅ Start with ItemsManagementScreen tests
3. ✅ Move to WBSManagementScreen tests
4. ✅ Finish with SiteManagementScreen tests
5. ✅ Check off Pass/Fail for each test case
6. ✅ Document any bugs found

**Estimated Setup Time:** 20-30 minutes
**Estimated Testing Time:** 4-6 hours
**Total Time:** ~5-7 hours for complete Day 6

---

**Good luck with testing! This realistic metro construction data should provide excellent test coverage.** 🚀

---

**Document Created:** October 24, 2025
**Status:** 🟢 **READY TO USE**
**Data Type:** Realistic Mumbai Metro Construction Project
**Total Items:** 30 items across 3 sites

---

**END OF TEST DATA DOCUMENT**
