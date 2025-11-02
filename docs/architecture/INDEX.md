# Architecture Documentation

**Purpose:** High-level system architecture and database design documentation

---

## Documents

### [ARCHITECTURE_UNIFIED.md](./ARCHITECTURE_UNIFIED.md)
**Purpose:** Complete unified architecture documentation (SINGLE SOURCE OF TRUTH)
**Last Updated:** October 30, 2025
**Status:** ✅ Active - v2.2 (Activity 2, Week 8)

**Contents:**
- Project structure and organization
- Architecture layers (Presentation, Data, Service, Platform)
- Navigation architecture with role-based access
- Database architecture (WatermelonDB Schema v20)
- Service layer organization
- Key features (offline-first, sync, planning, admin)
- Development practices and patterns
- Technical stack
- Version history

**When to use:** This is the master reference for all architectural decisions and system design.

---

### [DATABASE.md](./DATABASE.md)
**Purpose:** Complete database schema and relationships
**Last Updated:** October 2025
**Status:** ✅ Active - Schema v20

**Contents:**
- Schema version history (v1-v20)
- Table definitions with all fields
- Entity relationships (ERD)
- WatermelonDB field naming conventions
- Query patterns
- Sync support (Activity 2)
- Security fields (Activity 1)

**When to use:** Reference this when working with database models, queries, or schema migrations.

---

### [CONSTRUCTION_APP_README.md](./CONSTRUCTION_APP_README.md)
**Purpose:** Construction industry-specific features and workflows
**Last Updated:** October 2025
**Status:** ✅ Active

**Contents:**
- Construction-specific workflows
- Site management features
- Progress tracking methods
- Material management
- Hindrance reporting
- Site inspections
- Daily reports

**When to use:** Understanding construction domain requirements and business logic.

---

## Related Documentation

### Implementation Docs
- [Activity 1 - Security](../implementation/activity-1-security/)
- [Activity 2 - Sync](../implementation/activity-2-sync/)
- [Planning Module](../implementation/planning-module/)

### Service Documentation
- [Sync Architecture](../sync/SYNC_ARCHITECTURE.md)
- [API Documentation](../api/API_DOCUMENTATION.md)

---

## Architecture Decision Records

**Major Decisions:**
1. **Offline-First with WatermelonDB** - Chosen for robust offline support
2. **Role-Based Navigation** - Separate navigators per user role
3. **Bidirectional Sync** - Last-Write-Wins with version tracking
4. **JWT Authentication** - Access + refresh tokens for security
5. **Exponential Backoff** - Retry logic for sync failures

---

**Navigation:**
- [Back to Docs Index](../00-INDEX.md)
- [Database Schema](./DATABASE.md)
- [Unified Architecture](./ARCHITECTURE_UNIFIED.md)
