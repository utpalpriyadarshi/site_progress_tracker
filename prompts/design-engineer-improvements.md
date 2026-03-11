# General Information:
## Date 12-02-2026
### For all improvement/fixes please create branch then implement succesfully, check for quality and errors, test, commit, create PR, Push to remote and merge.


## Design Engineer Improvements

1. Let us look Substation A document DD-SIM-001, it is overall project level document, this should be part of System Studies-Site, how it is possible to move document from one site to another site.-Done
2. It is time taking to create design document in substations. Are there ways to quickly generate design documents. Please suggest solution dont implement now.-Done
3. When we create document through fab button in Design Doc tab, Key Date has to be assigned to document, this approach is not correct, it should be addresd at top level, if we say simulation or Substation A belongs to a perticular milestone, all drawings/documents/studies should belongs to that Key dates instead of assigning indivisulal documents key dates. 

## Goals


## Changes


## Notes

### Point 3 — Site-Level Key Date Inheritance (Analysis & Implementation Plan)

**Status:** ON HOLD — needs further thought before implementation.

---

**Problem:** Currently each document gets a Key Date assigned individually via the create dialog. This is tedious and conceptually wrong — if a site belongs to a milestone, all its documents should inherit that Key Date.

**Architecture Findings:**
- `KeyDateSiteModel` junction table already links Sites to Key Dates (set by Planner)
- The design vs site-works distinction is NOT by Key Date category — ANY Key Date linked to a site can track both tracks:
  - **Site works track**: active when `site.supervisorId` is assigned (progress from Items)
  - **Design track**: active when `site.designEngineerId` is assigned (progress from Design Documents)
- The mix is controlled by `KeyDateModel.designWeightage` (0-100%)
- When Planner assigns a site to a supervisor → it's for site works. When assigned to a design engineer → it's for design docs.
- Each site typically has one Key Date for design purposes, though multiple are possible.

**Proposed Solution:**

#### A. Site-specific documents (installation, as_built)
- Auto-resolve Key Date from `KeyDateSiteModel` lookup (`site_id → key_date_id`)
- Replace the manual Key Date picker with a **read-only display** showing the inherited Key Date
- If a site is linked to multiple Key Dates, show a **filtered dropdown** (only KDs linked to that site, not the full project list)

#### B. Site-less documents (simulation_study, product_equipment)
- Keep the existing Key Date dropdown picker (unchanged) since there's no site to inherit from

#### C. Existing documents — Bulk sync
- Add a "Sync Key Dates from Sites" FAB action to retroactively update existing documents based on their site's KeyDateSite mapping
- Only auto-update documents where the site has exactly 1 linked KD; sites with multiple KDs are skipped (manual resolution needed)

#### D. Template-created documents
- Auto-assign Key Date from site mapping when applying templates via `ApplyTemplateDialog`

**Files to modify:**
1. `src/design_engineer/DesignDocumentManagementScreen.tsx` — load KeyDateSite mappings, auto-resolve on create, bulk sync handler
2. `src/design_engineer/components/CreateDesignDocumentDialog.tsx` — accept `keyDateSiteMappings` prop, show read-only/filtered UI for site-specific docs, remove `DOC_TYPE_TO_KD_CATEGORY` auto-suggestion
3. `src/design_engineer/components/ApplyTemplateDialog.tsx` — auto-assign keyDateId from site mapping

**Implementation approach:**
- On mount, query `key_date_sites` for all project sites, build `siteId → Array<{ keyDateId, keyDateCode, keyDateDescription }>` lookup
- In `handleCreateOrUpdateDocument()`: if `requiresSite && siteId` and site has 1 KD → auto-assign; if multiple → use form selection from filtered list
- Bulk sync: query all docs with `siteId` but missing/mismatched `keyDateId`, batch-update in `database.write()`

**Edge cases:**
- Site has no Key Date mapping → info text shown, document created without keyDateId
- Site has multiple Key Dates → filtered dropdown (not auto-assign)
- Editing existing site-specific docs → inherited Key Date shown as read-only

**Detailed plan with code snippets:** See `~/.claude/plans/fizzy-chasing-gadget.md`

### Quick Document Generation Suggestions (Item 2)-Done

1. **Template-based Bulk Create** — Define a site template (e.g., "Standard Substation") with a predefined list of document types, numbers, and titles. When creating a new site, the engineer selects a template and all documents are auto-generated as drafts with sequential numbering.-Done

2. **Clone from Site** — Extend existing Copy feature so when a new site is added, the engineer can pick an existing site as a "source template" and clone all its document structure (numbers, titles, types, categories, weightages) in one action.

3. **CSV/Excel Import** — Allow importing a spreadsheet of document definitions (number, title, type, category, weightage) to bulk-create documents for a site.

4. **Default Document Set per Document Type** — Configure a default set of documents per type (e.g., Installation always gets "Layout Plan", "Cable Schedule", etc.). When the engineer selects a site + type, auto-populate the standard documents.

**Recommendation:** Option 1 or 2 would give the most value with the least effort, since the copy infrastructure already exists.


My list:

Below is a **detailed breakdown of Design Documents** in a **Metro Railway Electrification (MRE)** project, structured under the four categories you requested:

> 1️⃣ Studies
> 2️⃣ Installation
> 3️⃣ Product
> 4️⃣ As-Built

This is aligned with typical 25 kV AC Metro systems (commonly following guidelines of Research Designs and Standards Organisation and approvals under Commissioner of Metro Railway Safety).

---

# 1️⃣ STUDIES DOCUMENTS

These are analytical and calculation-based documents forming the engineering foundation of the system.

## A. System-Level Studies (Traction Power System)

### 🔹 Electrical Studies

* Design Basis Report (DBR)
* Load Flow Study (Normal & Degraded Mode)
* Short Circuit Study (Max/Min Fault Level)
* Protection Coordination Study
* Relay Setting Calculations
* Insulation Coordination Study
* Harmonic Analysis Study
* Voltage Drop Calculations
* System Loss Calculation
* Reliability & Redundancy Study (N-1 compliance)
* Regenerative Braking Energy Study

### 🔹 Traction Substation (TSS) Studies

* Transformer Rating Calculation
* Rectifier Capacity Calculation
* Auxiliary Transformer Sizing
* Busbar Sizing Calculation
* Earthing Grid Design Calculation
* Step & Touch Potential Calculation
* Lightning Protection Risk Assessment

---

## B. Overhead Catenary System (OCS) / OHE Studies

* OCS System Design Report
* OCS Span & Tension Calculation
* Sag-Tension Chart (Temperature-based)
* Encumbrance & Clearance Study
* Pantograph–Catenary Dynamic Interaction Study
* Sectioning & Paralleling Study
* Neutral Section Study
* Bonding & Return Current Study
* Stray Current Analysis

---

## C. Interface Studies

* Civil Interface Clearance Study
* Track–OCS Geometry Study
* Signaling Immunization Study
* EMC/EMI Study
* Rolling Stock Interface Study
* SCADA Communication Load Study
* Depot Electrification Study

---

## D. Safety & Risk Studies

* Hazard Identification & Risk Assessment (HIRA)
* Failure Mode & Effect Analysis (FMEA)
* Reliability, Availability, Maintainability (RAM) Study
* Fire Risk Assessment (for TSS)

---

# 2️⃣ INSTALLATION DESIGN DOCUMENTS

These are execution-oriented drawings and documents used during construction and erection.

---

## A. Traction Substation (TSS)

### Layout & Arrangement

* General Arrangement (GA) Drawings
* Equipment Layout Plan
* Transformer Layout
* Cable Trench Layout
* Earthing Layout Plan
* Lightning Protection Layout

### Electrical Drawings

* Single Line Diagram (SLD)
* AC & DC Schematic Diagrams
* Protection Wiring Diagram
* Interlocking Logic Diagram
* SCADA I/O List
* Cable Schedule
* Cable Routing Drawings
* Control Panel Layout

---

## B. OCS / OHE Installation Drawings

* OCS Layout Plan (Chainage-wise)
* OCS Profile Drawing
* Cross-Section Drawings
* Foundation Drawing (Mast/Portal)
* Structure Erection Drawing
* Bracket Assembly Drawing
* Registration Plan
* Sectioning Diagram
* Switching Station Layout
* Feeder & Return Conductor Layout
* Bonding Plan
* Depot OCS Layout

---

## C. Third Rail System (if applicable)

* Third Rail Alignment Drawing
* Support Bracket Installation Drawing
* Expansion Joint Layout
* Section Insulator Installation Detail
* End Approach Ramp Drawing

---

## D. Earthing & Bonding Installation

* Earth Pit Location Drawing
* Earth Grid Layout
* Rail Bonding Drawing
* Cross Bonding Layout
* Impedance Bond Location Drawing

---

# 3️⃣ PRODUCT DESIGN DOCUMENTS

These are manufacturer/vendor-based detailed engineering documents for supplied equipment.

---

## A. Traction Power Equipment

### Transformers

* Transformer GA Drawing
* Nameplate Details
* Bushing Arrangement Drawing
* Terminal Plan
* Foundation Bolt Plan
* Loss Calculation Sheet

### Circuit Breakers

* GA Drawing
* Control Schematic
* Spring Charging Diagram
* Interlock Scheme

### Protection Relays

* Relay Logic Diagram
* Setting Sheet
* Communication Protocol Configuration

### SCADA System

* SCADA Architecture Diagram
* Network Topology Drawing
* Communication Interface Drawing
* RTU Configuration Sheet

---

## B. OCS Components

* Cantilever Assembly Drawing
* Dropper Design Drawing
* Insulator Detail Drawing
* Section Insulator Drawing
* Auto Tensioning Device Drawing
* Portal Boom Fabrication Drawing
* Mast Fabrication Drawing
* Clamp & Fitting Design Drawings

---

## C. Panel & Control System Documents

* Panel GA Drawing
* Internal Wiring Diagram
* Terminal Block Layout
* BOM (Bill of Material)
* Heat Dissipation Calculation

---

## D. Testing Documents (Product Level)

* Type Test Certificates
* Routine Test Reports
* Factory Acceptance Test (FAT) Report
* Compliance Matrix vs Specification

---

# 4️⃣ AS-BUILT DOCUMENTS

Prepared after installation reflecting actual site conditions. These are critical for CMRS approval and O&M handover.

---

## A. As-Built Drawings

* Final OCS Layout (Chainage-wise)
* Final TSS GA Drawing
* Final Cable Routing Drawing
* As-Built SLD
* As-Built Earthing Layout
* As-Built Bonding Layout
* Final Sectioning Diagram
* Updated Protection Settings
* Updated SCADA I/O List

---

## B. As-Built Documentation Records

* Redline Marked Drawings
* Material Reconciliation Statement
* Cable Megger Test Results (Final)
* Earth Resistance Test Results
* Final Relay Settings File
* Energization Certificate
* Integrated Testing Report

---

## C. Asset Documentation

* Equipment Data Book
* GIS-Based Asset Mapping (if applicable)
* Asset Tagging List
* Serial Number Register
* Warranty Documentation

---

# 🔎 Summary Comparison

| Category     | Purpose                          | Stage                        | Nature                   |
| ------------ | -------------------------------- | ---------------------------- | ------------------------ |
| Studies      | System validation & calculations | Pre-design / Detailed design | Analytical               |
| Installation | Site execution                   | Construction phase           | Layout & Wiring drawings |
| Product      | Vendor-specific detailed design  | Manufacturing stage          | Equipment-level          |
| As-Built     | Final site configuration         | Post-construction            | Record documents         |

---

or

Here is the **complete Markdown version** of the Design Documents classification for a **Metro Railway Electrification (MRE)** project.

You can directly copy this into your document system, Confluence, SharePoint, or DMS.

---

# Metro Railway Electrification (MRE)

# Design Document Classification

*(Typical 25 kV AC Metro System aligned with guidelines of Research Designs and Standards Organisation and approvals under Commissioner of Metro Railway Safety)*

---

# 1. Studies Documents

Analytical and calculation-based documents forming the engineering foundation of the system.

## 1.1 System-Level Studies (Traction Power System)

### Electrical Studies

* Design Basis Report (DBR)
* Load Flow Study (Normal & Degraded Mode)
* Short Circuit Study (Max/Min Fault Level)
* Protection Coordination Study
* Relay Setting Calculations
* Insulation Coordination Study
* Harmonic Analysis Study
* Voltage Drop Calculations
* System Loss Calculation
* Reliability & Redundancy Study (N-1 compliance)
* Regenerative Braking Energy Study

### Traction Substation (TSS) Studies

* Transformer Rating Calculation
* Rectifier Capacity Calculation
* Auxiliary Transformer Sizing
* Busbar Sizing Calculation
* Earthing Grid Design Calculation
* Step & Touch Potential Calculation
* Lightning Protection Risk Assessment

---

## 1.2 OCS / OHE Studies

* OCS System Design Report
* OCS Span & Tension Calculation
* Sag-Tension Chart (Temperature-based)
* Encumbrance & Clearance Study
* Pantograph–Catenary Dynamic Interaction Study
* Sectioning & Paralleling Study
* Neutral Section Study
* Bonding & Return Current Study
* Stray Current Analysis

---

## 1.3 Interface Studies

* Civil Interface Clearance Study
* Track–OCS Geometry Study
* Signaling Immunization Study
* EMC/EMI Study
* Rolling Stock Interface Study
* SCADA Communication Load Study
* Depot Electrification Study

---

## 1.4 Safety & Risk Studies

* Hazard Identification & Risk Assessment (HIRA)
* Failure Mode & Effect Analysis (FMEA)
* Reliability, Availability, Maintainability (RAM) Study
* Fire Risk Assessment (for TSS)

---

# 2. Installation Design Documents

Execution-oriented drawings and documents used during construction and erection.

---

## 2.1 Traction Substation (TSS)

### Layout & Arrangement

* General Arrangement (GA) Drawings
* Equipment Layout Plan
* Transformer Layout
* Cable Trench Layout
* Earthing Layout Plan
* Lightning Protection Layout

### Electrical Drawings

* Single Line Diagram (SLD)
* AC & DC Schematic Diagrams
* Protection Wiring Diagram
* Interlocking Logic Diagram
* SCADA I/O List
* Cable Schedule
* Cable Routing Drawings
* Control Panel Layout

---

## 2.2 OCS / OHE Installation Drawings

* OCS Layout Plan (Chainage-wise)
* OCS Profile Drawing
* Cross-Section Drawings
* Foundation Drawing (Mast/Portal)
* Structure Erection Drawing
* Bracket Assembly Drawing
* Registration Plan
* Sectioning Diagram
* Switching Station Layout
* Feeder & Return Conductor Layout
* Bonding Plan
* Depot OCS Layout

---

## 2.3 Third Rail System (If Applicable)

* Third Rail Alignment Drawing
* Support Bracket Installation Drawing
* Expansion Joint Layout
* Section Insulator Installation Detail
* End Approach Ramp Drawing

---

## 2.4 Earthing & Bonding Installation

* Earth Pit Location Drawing
* Earth Grid Layout
* Rail Bonding Drawing
* Cross Bonding Layout
* Impedance Bond Location Drawing

---

# 3. Product Design Documents

Manufacturer/vendor-based detailed engineering documents for supplied equipment.

---

## 3.1 Traction Power Equipment

### Transformers

* Transformer GA Drawing
* Nameplate Details
* Bushing Arrangement Drawing
* Terminal Plan
* Foundation Bolt Plan
* Loss Calculation Sheet

### Circuit Breakers

* GA Drawing
* Control Schematic
* Spring Charging Diagram
* Interlock Scheme

### Protection Relays

* Relay Logic Diagram
* Setting Sheet
* Communication Protocol Configuration

### SCADA System

* SCADA Architecture Diagram
* Network Topology Drawing
* Communication Interface Drawing
* RTU Configuration Sheet

---

## 3.2 OCS Components

* Cantilever Assembly Drawing
* Dropper Design Drawing
* Insulator Detail Drawing
* Section Insulator Drawing
* Auto Tensioning Device Drawing
* Portal Boom Fabrication Drawing
* Mast Fabrication Drawing
* Clamp & Fitting Design Drawings

---

## 3.3 Panel & Control System Documents

* Panel GA Drawing
* Internal Wiring Diagram
* Terminal Block Layout
* Bill of Material (BOM)
* Heat Dissipation Calculation

---

## 3.4 Product Testing Documents

* Type Test Certificates
* Routine Test Reports
* Factory Acceptance Test (FAT) Report
* Compliance Matrix vs Specification

---

# 4. As-Built Documents

Prepared after installation reflecting actual site conditions. Critical for safety approval and O&M handover.

---

## 4.1 As-Built Drawings

* Final OCS Layout (Chainage-wise)
* Final TSS GA Drawing
* Final Cable Routing Drawing
* As-Built SLD
* As-Built Earthing Layout
* As-Built Bonding Layout
* Final Sectioning Diagram
* Updated Protection Settings
* Updated SCADA I/O List

---

## 4.2 As-Built Records

* Redline Marked Drawings
* Material Reconciliation Statement
* Cable Megger Test Results (Final)
* Earth Resistance Test Results
* Final Relay Settings File
* Energization Certificate
* Integrated Testing Report

---

## 4.3 Asset Documentation

* Equipment Data Book
* GIS-Based Asset Mapping (if applicable)
* Asset Tagging List
* Serial Number Register
* Warranty Documentation

---

# Summary Comparison

| Category     | Purpose                              | Stage                        | Nature                   |
| ------------ | ------------------------------------ | ---------------------------- | ------------------------ |
| Studies      | System validation & calculations     | Pre-design / Detailed design | Analytical               |
| Installation | Site execution                       | Construction phase           | Layout & Wiring drawings |
| Product      | Vendor-specific detailed engineering | Manufacturing stage          | Equipment-level          |
| As-Built     | Final site configuration             | Post-construction            | Record documentation     |

---


