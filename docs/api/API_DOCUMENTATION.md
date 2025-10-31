# Construction Tracker API Documentation

**API Version:** 1.0.0
**Last Updated:** October 31, 2025
**Activity:** Activity 2 - Week 9 Documentation
**Backend Status:** ✅ Deployed and Operational (97% test pass rate)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Common Headers](#common-headers)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Authentication Endpoints](#authentication-endpoints)
8. [Sync Endpoints](#sync-endpoints)
9. [Project Endpoints](#project-endpoints)
10. [Site Endpoints](#site-endpoints)
11. [Category Endpoints](#category-endpoints)
12. [Item Endpoints](#item-endpoints)
13. [Material Endpoints](#material-endpoints)
14. [Rate Limiting](#rate-limiting)
15. [Pagination](#pagination)
16. [Filtering](#filtering)

---

## Overview

The Construction Tracker API provides RESTful endpoints for managing construction project data with offline-first synchronization capabilities.

### Key Features

- ✅ JWT-based authentication
- ✅ Bidirectional sync (push/pull)
- ✅ Version tracking for conflict resolution
- ✅ Incremental sync support
- ✅ Pagination and filtering
- ✅ Cascading deletes

### Technology Stack

```
Runtime:    Node.js v18+
Framework:  Express.js
ORM:        Sequelize
Database:   PostgreSQL 14+
Auth:       JWT (jsonwebtoken)
```

---

## Base URL

### Development
```
http://localhost:3000
```

### Production
```
https://api.construction-tracker.com
```

**Note:** All production requests must use HTTPS.

---

## Authentication

### Method: JWT Bearer Token

All API endpoints (except `/api/auth/login`) require a valid JWT access token.

### Token Types

1. **Access Token**
   - Duration: 1 hour
   - Used for: API requests
   - Header: `Authorization: Bearer <access_token>`

2. **Refresh Token**
   - Duration: 7 days
   - Used for: Getting new access tokens
   - Endpoint: `POST /api/auth/refresh`

### Token Storage

**Mobile App:** Stored securely in AsyncStorage via `TokenStorage` service

### Token Lifecycle

```
1. Login → Receive access_token + refresh_token
2. Use access_token for API requests
3. Before expiry → Use refresh_token to get new access_token
4. Logout → Clear all tokens
```

---

## Common Headers

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Optional Headers

```http
X-Device-ID: <unique-device-identifier>
X-App-Version: 2.2.0
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10,
  "timestamp": 1698765450000
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful delete, no content returned |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Version conflict detected |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Server temporarily unavailable |

### Common Error Codes

```typescript
AUTH_TOKEN_MISSING     // No Authorization header
AUTH_TOKEN_INVALID     // Token verification failed
AUTH_TOKEN_EXPIRED     // Token has expired
RESOURCE_NOT_FOUND     // Requested resource doesn't exist
VALIDATION_ERROR       // Request data validation failed
VERSION_CONFLICT       // Conflict detected during sync
DATABASE_ERROR         // Database operation failed
NETWORK_ERROR          // Network connectivity issue
```

---

## Authentication Endpoints

### POST /api/auth/login

**Description:** Authenticate user and receive JWT tokens

**Request:**
```json
{
  "username": "admin",
  "password": "Admin@2025"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "admin",
      "email": "admin@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Username or password is incorrect"
}
```

---

### POST /api/auth/refresh

**Description:** Get new access token using refresh token

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

### POST /api/auth/logout

**Description:** Invalidate current session

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Sync Endpoints

### POST /api/sync/push

**Description:** Push local changes to server (bulk operation)

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "changes": {
    "projects": [
      {
        "id": "proj-123",
        "name": "Highway Construction",
        "client": "DOT Agency",
        "status": "active",
        "_version": 2,
        "sync_status": "synced",
        "updated_at": 1698765440000
      }
    ],
    "sites": [
      {
        "id": "site-456",
        "name": "Main Site",
        "project_id": "proj-123",
        "_version": 3,
        "updated_at": 1698765445000
      }
    ],
    "items": [
      {
        "id": "item-789",
        "name": "Foundation Work",
        "site_id": "site-456",
        "status": "in_progress",
        "completed_quantity": 150,
        "_version": 5,
        "updated_at": 1698765450000
      }
    ]
  },
  "last_sync_at": 1698765400000
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sync push successful",
  "data": {
    "syncedCount": 3,
    "conflicts": [],
    "timestamp": 1698765460000
  }
}
```

**Conflict Response:** `200 OK` (with conflicts array)
```json
{
  "success": true,
  "message": "Sync push completed with conflicts",
  "data": {
    "syncedCount": 2,
    "conflicts": [
      {
        "table": "items",
        "id": "item-789",
        "clientVersion": 5,
        "serverVersion": 7,
        "message": "Server has newer version"
      }
    ],
    "timestamp": 1698765460000
  }
}
```

**Notes:**
- All models are optional in the request
- Empty arrays are allowed
- Server validates foreign keys
- Version conflicts are returned but don't fail the request

---

### GET /api/sync/pull

**Description:** Pull changes from server since last sync (incremental)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
last_sync_at=1698765400000  (optional, Unix timestamp in milliseconds)
```

**Example:**
```http
GET /api/sync/pull?last_sync_at=1698765400000
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Pulled 10 records",
  "data": {
    "projects": [
      {
        "id": "proj-123",
        "name": "Highway Construction Updated",
        "client": "DOT Agency",
        "status": "active",
        "_version": 3,
        "sync_status": "synced",
        "updated_at": 1698765450000,
        "created_at": 1698765000000
      }
    ],
    "sites": [
      {
        "id": "site-456",
        "name": "Main Site",
        "location": "Mile 10",
        "project_id": "proj-123",
        "_version": 4,
        "updated_at": 1698765455000
      }
    ],
    "categories": [...],
    "items": [...],
    "materials": [...]
  },
  "timestamp": 1698765460000,
  "counts": {
    "projects": 1,
    "sites": 1,
    "categories": 2,
    "items": 5,
    "materials": 1
  }
}
```

**Notes:**
- If `last_sync_at` is omitted, returns all records (full sync)
- Only returns records updated after `last_sync_at`
- Response timestamp should be stored for next pull
- Empty model arrays are omitted from response

---

### GET /api/sync/status

**Description:** Get sync status and statistics

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "totalRecords": 1250,
  "totalPending": 5,
  "stats": {
    "projects": 10,
    "sites": 50,
    "categories": 15,
    "items": 1000,
    "materials": 175
  },
  "pending": {
    "projects": 0,
    "sites": 2,
    "items": 3,
    "materials": 0
  },
  "lastSync": "2025-10-31T10:30:00.000Z"
}
```

---

## Project Endpoints

### GET /api/projects

**Description:** Get all projects

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
limit=20              (optional, default: 100)
offset=0              (optional, default: 0)
updated_after=<timestamp>  (optional, Unix timestamp)
```

**Example:**
```http
GET /api/projects?limit=10&offset=0
GET /api/projects?updated_after=1698765000000
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
      "name": "Highway Construction",
      "client": "DOT Agency",
      "start_date": 1698765000000,
      "end_date": 1730301000000,
      "status": "active",
      "budget": 5000000,
      "sync_status": "synced",
      "_version": 1,
      "created_at": 1698765100000,
      "updated_at": 1698765100000
    }
  ]
}
```

---

### GET /api/projects/:id

**Description:** Get a single project by ID

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Example:**
```http
GET /api/projects/97b1cc6b-4c47-46ed-959c-8aa3b3289f55
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
    "name": "Highway Construction",
    "client": "DOT Agency",
    "status": "active",
    "budget": 5000000,
    "_version": 1
  }
}
```

**Error:** `404 Not Found`
```json
{
  "success": false,
  "error": "Project not found",
  "message": "No project found with id: 97b1cc6b-4c47-46ed-959c-8aa3b3289f55"
}
```

---

### POST /api/projects

**Description:** Create a new project

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Highway Construction",
  "client": "DOT Agency",
  "start_date": 1698765000000,
  "end_date": 1730301000000,
  "status": "active",
  "budget": 5000000
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
    "name": "Highway Construction",
    "client": "DOT Agency",
    "status": "active",
    "budget": 5000000,
    "_version": 1,
    "sync_status": "synced",
    "created_at": 1698765100000,
    "updated_at": 1698765100000
  }
}
```

**Validation Error:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Project name is required"
}
```

---

### PUT /api/projects/:id

**Description:** Update an existing project

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "completed",
  "budget": 6000000
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
    "name": "Highway Construction",
    "status": "completed",
    "budget": 6000000,
    "_version": 2,
    "updated_at": 1698765500000
  }
}
```

**Notes:**
- `_version` is automatically incremented
- `updated_at` is automatically set
- Partial updates are supported (only send changed fields)

---

### DELETE /api/projects/:id

**Description:** Delete a project (cascades to sites, items, etc.)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": {
    "id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
    "deletedRelations": {
      "sites": 3,
      "items": 150,
      "materials": 50
    }
  }
}
```

**Notes:**
- Cascading delete removes all related records
- Operation is atomic (all or nothing)

---

## Site Endpoints

### GET /api/sites

**Description:** Get all sites

**Query Parameters:**
```
project_id=<uuid>     (optional, filter by project)
updated_after=<timestamp>  (optional)
limit=100             (optional)
offset=0              (optional)
```

**Example:**
```http
GET /api/sites?project_id=proj-123&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "d9b0f289-9cfb-44b5-9808-8f19e788b9df",
      "name": "Main Site",
      "location": "Mile 10",
      "project_id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
      "supervisor_id": "user-123",
      "_version": 1,
      "sync_status": "synced",
      "created_at": 1698765200000,
      "updated_at": 1698765200000
    }
  ]
}
```

---

### POST /api/sites

**Description:** Create a new site

**Request:**
```json
{
  "name": "Main Site",
  "location": "Mile 10",
  "project_id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
  "supervisor_id": "user-123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Site created successfully",
  "data": {
    "id": "d9b0f289-9cfb-44b5-9808-8f19e788b9df",
    "name": "Main Site",
    "location": "Mile 10",
    "project_id": "97b1cc6b-4c47-46ed-959c-8aa3b3289f55",
    "_version": 1,
    "sync_status": "synced"
  }
}
```

**Foreign Key Error:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Foreign key constraint failed",
  "message": "Invalid project_id: Project does not exist"
}
```

---

### PUT /api/sites/:id

**Description:** Update a site

**Request:**
```json
{
  "location": "Mile 12 Updated",
  "supervisor_id": "user-456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Site updated successfully",
  "data": {
    "id": "d9b0f289-9cfb-44b5-9808-8f19e788b9df",
    "location": "Mile 12 Updated",
    "supervisor_id": "user-456",
    "_version": 2,
    "updated_at": 1698765600000
  }
}
```

---

### DELETE /api/sites/:id

**Description:** Delete a site (cascades to items, hindrances, daily reports)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

---

## Category Endpoints

### GET /api/categories

**Description:** Get all categories

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "cat-123",
      "name": "Civil Works",
      "description": "Foundation and structure",
      "_version": 1,
      "sync_status": "synced"
    }
  ]
}
```

---

### POST /api/categories

**Description:** Create a new category

**Request:**
```json
{
  "name": "Civil Works",
  "description": "Foundation and structural works"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "cat-123",
    "name": "Civil Works",
    "description": "Foundation and structural works",
    "_version": 1,
    "sync_status": "synced"
  }
}
```

---

### PUT /api/categories/:id

**Description:** Update a category

**Request:**
```json
{
  "description": "Civil engineering and structural works"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "cat-123",
    "description": "Civil engineering and structural works",
    "_version": 2
  }
}
```

---

### DELETE /api/categories/:id

**Description:** Delete a category (sets `category_id = NULL` on related items)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Notes:**
- Items are NOT deleted, only their `category_id` is set to NULL
- This preserves item data while removing categorization

---

## Item Endpoints

### GET /api/items

**Description:** Get all items

**Query Parameters:**
```
site_id=<uuid>        (optional, filter by site)
category_id=<uuid>    (optional, filter by category)
status=<string>       (optional, filter by status)
updated_after=<timestamp>  (optional)
limit=100             (optional)
offset=0              (optional)
```

**Example:**
```http
GET /api/items?site_id=site-456&status=in_progress&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "a0cb363b-5675-4ee6-b31b-1c406251eac4",
      "name": "Foundation Work",
      "site_id": "site-456",
      "category_id": "cat-123",
      "unit_of_measurement": "m3",
      "planned_quantity": 500,
      "completed_quantity": 150,
      "wbs_code": "WBS-1.1.1",
      "wbs_level": 1,
      "status": "in_progress",
      "is_milestone": true,
      "is_critical_path": false,
      "project_phase": "construction",
      "created_by_role": "planner",
      "_version": 5,
      "sync_status": "synced",
      "created_at": 1698765300000,
      "updated_at": 1698765800000
    }
  ]
}
```

**Notes:**
- Items have 30+ fields (see full schema in DATABASE.md)
- Default values are applied for optional fields
- WBS fields support hierarchical project structures

---

### POST /api/items

**Description:** Create a new item

**Request:**
```json
{
  "name": "Foundation Work",
  "site_id": "site-456",
  "category_id": "cat-123",
  "unit_of_measurement": "m3",
  "planned_quantity": 500,
  "wbs_code": "WBS-1.1.1",
  "status": "not_started",
  "is_milestone": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "a0cb363b-5675-4ee6-b31b-1c406251eac4",
    "name": "Foundation Work",
    "planned_quantity": 500,
    "completed_quantity": 0,
    "wbs_code": "WBS-1.1.1",
    "wbs_level": 1,
    "is_milestone": true,
    "project_phase": "construction",
    "created_by_role": "planner",
    "is_critical_path": false,
    "_version": 1,
    "sync_status": "synced"
  }
}
```

**Notes:**
- Many fields have default values (see response)
- `completed_quantity` defaults to 0
- `wbs_level` is auto-calculated from `wbs_code`
- `project_phase` defaults to "construction"

---

### PUT /api/items/:id

**Description:** Update an item

**Request:**
```json
{
  "status": "in_progress",
  "completed_quantity": 150,
  "is_critical_path": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": {
    "id": "a0cb363b-5675-4ee6-b31b-1c406251eac4",
    "status": "in_progress",
    "completed_quantity": 150,
    "is_critical_path": true,
    "_version": 2
  }
}
```

---

### DELETE /api/items/:id

**Description:** Delete an item (cascades to progress logs, materials, hindrances)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## Material Endpoints

### GET /api/materials

**Description:** Get all materials

**Query Parameters:**
```
item_id=<uuid>        (optional, filter by item)
status=<string>       (optional, filter by status)
```

**Example:**
```http
GET /api/materials?item_id=item-789&status=delivered
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "e87a93a6-299e-4805-b389-9d2d97d0b7b5",
      "item_id": "item-789",
      "material_name": "Concrete Mix",
      "unit": "m3",
      "quantity_required": 500,
      "quantity_available": 350,
      "quantity_used": 0,
      "supplier": "BuildCo",
      "status": "delivered",
      "_version": 2,
      "sync_status": "synced"
    }
  ]
}
```

---

### POST /api/materials

**Description:** Create a new material

**Request:**
```json
{
  "item_id": "item-789",
  "material_name": "Concrete Mix",
  "unit": "m3",
  "quantity_required": 500,
  "quantity_available": 200,
  "supplier": "BuildCo",
  "status": "ordered"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Material created successfully",
  "data": {
    "id": "e87a93a6-299e-4805-b389-9d2d97d0b7b5",
    "item_id": "item-789",
    "material_name": "Concrete Mix",
    "quantity_required": 500,
    "quantity_available": 200,
    "quantity_used": 0,
    "status": "ordered",
    "_version": 1
  }
}
```

**Notes:**
- `quantity_used` defaults to 0
- Both `name` and `material_name` parameters work (aliases)

---

### PUT /api/materials/:id

**Description:** Update a material

**Request:**
```json
{
  "quantity_available": 350,
  "status": "delivered"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Material updated successfully",
  "data": {
    "id": "e87a93a6-299e-4805-b389-9d2d97d0b7b5",
    "quantity_available": 350,
    "status": "delivered",
    "_version": 2
  }
}
```

---

### DELETE /api/materials/:id

**Description:** Delete a material

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Material deleted successfully"
}
```

---

## Rate Limiting

### Default Limits

```
Requests per IP:   100 per 15 minutes
Requests per user: 1000 per hour
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765900000
```

### Rate Limit Exceeded Response

**Status:** `429 Too Many Requests`
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## Pagination

### Query Parameters

```
limit=<number>   Default: 100, Max: 500
offset=<number>  Default: 0
```

### Example

```http
GET /api/items?limit=50&offset=100
```

### Response with Pagination

```json
{
  "success": true,
  "count": 50,
  "total": 1250,
  "limit": 50,
  "offset": 100,
  "hasMore": true,
  "data": [...]
}
```

---

## Filtering

### By Updated Timestamp

All endpoints support filtering by `updated_after`:

```http
GET /api/projects?updated_after=1698765000000
```

Returns only records updated after the specified Unix timestamp (milliseconds).

### By Foreign Key

```http
GET /api/sites?project_id=proj-123
GET /api/items?site_id=site-456
GET /api/materials?item_id=item-789
```

### By Status

```http
GET /api/projects?status=active
GET /api/items?status=in_progress
GET /api/materials?status=delivered
```

### Combining Filters

```http
GET /api/items?site_id=site-456&status=in_progress&updated_after=1698765000000&limit=50
```

---

## Testing

### Test Results (Week 5)

**Total Endpoints:** 35
**Passed:** 34 (97%)
**Failed:** 1 (3%)

**Pass Rates by Category:**
- Projects: 80% (4/5)
- Sites: 100% (5/5) ✅
- Categories: 100% (5/5) ✅
- Items: 100% (7/7) ✅
- Materials: 100% (5/5) ✅
- Sync: 100% (3/3) ✅
- Delete: 100% (5/5) ✅

**Known Issue:**
- Project status validation (needs `"in_progress"` added to allowed values)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Oct 30, 2025 | Initial API release with sync support |

---

## Related Documents

- `docs/sync/SYNC_ARCHITECTURE.md` - Sync system architecture
- `docs/testing/WEEK_5_API_TEST_REPORT.md` - Detailed test results
- `DATABASE.md` - Complete database schema

---

**Document Status:** ✅ Complete
**Created:** October 31, 2025
**Author:** Development Team
**Activity:** Activity 2 - Week 9 Documentation

---

**END OF API DOCUMENTATION**
