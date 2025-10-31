# Documentation Index - Construction Site Progress Tracker

**Last Updated:** October 31, 2025
**Purpose:** Master index for all project documentation

---

## 📚 Quick Start

**New to the project?** Start here:
1. [README.md](../README.md) - Project overview and setup
2. [Architecture](./architecture/ARCHITECTURE_UNIFIED.md) - System architecture
3. [Database Schema](./architecture/DATABASE.md) - Database structure
4. [Testing Quick Start](./testing/TESTING_QUICKSTART.md) - 10-minute testing guide

---

## 📂 Documentation Structure

### [architecture/](./architecture/INDEX.md)
**Purpose:** High-level architecture and database design
**Files:** 3 documents
- ARCHITECTURE_UNIFIED.md - Complete system architecture (single source of truth)
- DATABASE.md - Database schema and relationships
- CONSTRUCTION_APP_README.md - Construction-specific features

---

### [implementation/](./implementation/INDEX.md)
**Purpose:** Implementation documentation organized by activity and sprint
**Subdirectories:**
- **[activity-1-security/](./implementation/activity-1-security/)** (8 files) - Security implementation (Weeks 1-3)
- **[activity-2-sync/](./implementation/activity-2-sync/)** (7 files) - Sync system (Weeks 4-8)
- **[activity-3-manager/](./implementation/activity-3-manager/)** (1 file) - Manager role (future)
- **[activity-4-logistics/](./implementation/activity-4-logistics/)** (1 file) - Logistics role (future)
- **[planning-module/](./implementation/planning-module/)** (15 files) - Planning features (v1.3-v1.9.1)
- **[sprints/](./implementation/sprints/)** (20 files) - Sprint-based implementation
  - sprint-1-2/ - Initial sprints
  - sprint-2-search-filter/ - Search/filter feature
  - sprint-3/ - Sprint 3
  - sprint-4-5-wbs/ - WBS management
- **[v2.0-ux-improvements/](./implementation/v2.0-ux-improvements/)** (9 files) - UX improvements
- **[v1.7-site-management/](./implementation/v1.7-site-management/)** (1 file) - Site management

---

### [testing/](./testing/INDEX.md)
**Purpose:** Testing guides, strategies, and test reports
**Files:** 15 documents
- Quick start guides (TESTING_QUICKSTART.md)
- Strategy documents (TESTING_STRATEGY.md)
- Manual test plans (ADMIN_TEST_PLAN.md, etc.)
- Test execution reports
- Debugging guides

---

### [api/](./api/INDEX.md)
**Purpose:** Backend API documentation
**Files:** 1 document
- API_DOCUMENTATION.md - RESTful API endpoints and authentication

---

### [sync/](./sync/INDEX.md)
**Purpose:** Synchronization system documentation
**Files:** 4 documents
- SYNC_ARCHITECTURE.md - Sync system design
- SYNC_TROUBLESHOOTING.md - Debugging sync issues
- SYNC_FIX_IMMEDIATE.md - Critical sync fixes
- SYNC_STATUS_DEBUG.md - Sync status debugging

---

### [performance/](./performance/INDEX.md)
**Purpose:** Performance analysis and optimization
**Files:** 2 documents
- PERFORMANCE_ANALYSIS_AND_FIXES.md - Performance optimization guide
- BCRYPT_PERFORMANCE_FIX.md - Bcrypt salt rounds optimization

---

### [guides/](./guides/INDEX.md)
**Purpose:** Component guides and UX documentation
**Files:** 2 documents
- SEARCH_FILTER_COMPONENTS_GUIDE.md - Search/filter component usage
- NAVIGATION_UX_IMPROVEMENTS.md - Navigation UX enhancements

---

### [fixes/](./fixes/INDEX.md)
**Purpose:** Bug fix documentation
**Files:** 2 documents
- SITE_SELECTOR_REFRESH_FIX.md - Site selector refresh bug
- SITE_SELECTOR_RUNTIME_ERROR_FIX.md - Runtime error fix

---

### [archive/](./archive/INDEX.md)
**Purpose:** Obsolete documentation (historical reference only)
**Files:** 5 documents
- Superseded status documents
- One-time reviews
- Outdated roadmaps

---

### [ai-prompts/](./ai-prompts/INDEX.md)
**Purpose:** AI assistant configuration and prompts
**Files:** 3 documents
- CLAUDE.md - Claude Code configuration (ACTIVE)
- GEMINI.md - Gemini prompts (REFERENCE)
- QWEN.md - Qwen prompts (REFERENCE)

---

## 🎯 Documentation by Purpose

### For Developers
- [Architecture Overview](./architecture/ARCHITECTURE_UNIFIED.md)
- [Database Schema](./architecture/DATABASE.md)
- [AI Assistant Guide](./ai-prompts/CLAUDE.md)
- [Testing Guide](./testing/TESTING_QUICKSTART.md)

### For Project Managers
- [Phase 1 Master Plan](./implementation/PHASE_1_MASTER_PLAN.md)
- [Activity Status](./implementation/INDEX.md)
- [Version Mapping](./implementation/VERSION_MAPPING.md)

### For QA/Testers
- [Testing Strategy](./testing/TESTING_STRATEGY.md)
- [Manual Testing Guide](./testing/MANUAL_TESTING_GUIDE.md)
- [Admin Test Plan](./testing/ADMIN_TEST_PLAN.md)

### For DevOps
- [API Documentation](./api/API_DOCUMENTATION.md)
- [Sync Architecture](./sync/SYNC_ARCHITECTURE.md)
- [Performance Analysis](./performance/PERFORMANCE_ANALYSIS_AND_FIXES.md)

---

## 📊 Project Status

**Current Version:** v2.2
**Schema Version:** 20
**Last Major Update:** Week 8 - Queue Management & Auto-Sync Complete

**Activity Progress:**
- ✅ Activity 1 (Security): 100% complete
- ✅ Activity 2 (Sync): 83% complete (5 of 6 weeks)
- ⏳ Activity 3 (Manager Role): Planned
- ⏳ Activity 4 (Logistics Role): Planned

---

## 🔗 External Resources

- [React Native Docs](https://reactnative.dev)
- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

---

## 📝 Contributing to Documentation

When adding new documentation:
1. Place files in the appropriate category directory
2. Update the INDEX.md file in that directory
3. Update this master index (00-INDEX.md)
4. Use clear, descriptive filenames
5. Include purpose and last updated date at the top

---

**Navigation:**
- [Back to Project Root](../README.md)
- [View All Implementation Docs](./implementation/INDEX.md)
- [View All Testing Docs](./testing/INDEX.md)
