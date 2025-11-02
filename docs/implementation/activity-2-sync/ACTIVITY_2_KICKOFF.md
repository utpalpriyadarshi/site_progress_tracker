# Activity 2: SyncService Implementation - Kickoff

**Status:** 🚀 **STARTING NOW**
**Start Date:** October 29, 2025
**Expected Completion:** December 10, 2025 (6 weeks)
**Prerequisites:** ✅ Activity 1 Complete (Security with JWT)

---

## 🎯 Activity 2 Overview

**Goal:** Transform the app from offline-only to offline-first with bidirectional sync

**Duration:** 6 weeks (30 working days)

**Key Deliverables:**
1. Backend API (Node.js + Express + PostgreSQL)
2. Bidirectional sync (push local changes, pull remote changes)
3. Conflict resolution (Last-Write-Wins + Kahn's algorithm)
4. Queue management with retry logic
5. Production deployment

---

## 📅 Week-by-Week Breakdown

### Week 4 (Days 1-5): Backend Setup & Core API
**Focus:** Build the foundation - backend infrastructure and first endpoints

**Tasks:**
- [ ] Initialize Node.js backend project
- [ ] Set up PostgreSQL database (local + production)
- [ ] Configure Sequelize ORM
- [ ] Create CRUD endpoints for `projects` and `sites`
- [ ] Set up JWT authentication middleware
- [ ] Deploy to production (Heroku/DigitalOcean/AWS)

**Expected Output:** Backend running with 2 models, authentication working

---

### Week 5 (Days 6-10): Complete API Endpoints + Sync Endpoints
**Focus:** Add all syncable models and sync infrastructure

**Tasks:**
- [ ] Create CRUD for all syncable models (items, progress_logs, hindrances, etc.)
- [ ] Implement cascade delete logic
- [ ] Create `/api/sync/push` endpoint (bulk changes)
- [ ] Create `/api/sync/pull` endpoint (incremental sync)
- [ ] Add conflict detection

**Expected Output:** Full API with sync endpoints ready

---

### Week 6 (Days 11-15): Client-Side Sync Logic
**Focus:** Implement push and pull on the React Native app

**Tasks:**
- [ ] Create `sync_queue` table (schema v18)
- [ ] Update `SyncService.ts` (currently a stub)
- [ ] Implement push logic (send local changes to server)
- [ ] Implement pull logic (receive remote changes)
- [ ] Update `sync_status` fields

**Expected Output:** Client can push and pull changes

---

### Week 7 (Days 16-20): Conflict Resolution
**Focus:** Handle conflicts when same data edited on multiple devices

**Tasks:**
- [ ] Add `_version` field to all syncable models (schema v19)
- [ ] Implement conflict detection
- [ ] Implement Last-Write-Wins (LWW) strategy
- [ ] Implement Kahn's algorithm for dependency order
- [ ] Test complex conflict scenarios

**Expected Output:** Conflicts resolved automatically, no orphaned records

---

### Week 8 (Days 21-25): Queue Management & Auto-Sync
**Focus:** Retry logic, network monitoring, auto-sync

**Tasks:**
- [ ] Implement exponential backoff retry
- [ ] Create dead letter queue for failed syncs
- [ ] Integrate NetInfo for network monitoring
- [ ] Auto-sync on app launch, network change, and every 5 minutes
- [ ] Create sync indicator UI
- [ ] Create sync monitoring screen (Admin)

**Expected Output:** Robust sync with retry, auto-sync working

---

### Week 9 (Days 26-30): Testing & Production Deployment
**Focus:** Comprehensive testing and final deployment

**Tasks:**
- [ ] Write unit tests for SyncService (80%+ coverage)
- [ ] Write integration tests (offline→online scenarios)
- [ ] Write API tests (Postman/Jest)
- [ ] Test multi-device sync
- [ ] Performance testing (1000 records < 30s)
- [ ] Deploy backend to production
- [ ] Document sync architecture
- [ ] Final production readiness review

**Expected Output:** Activity 2 complete, sync working in production

---

## 🚀 Immediate Next Steps (This Week)

### Day 1 (Today): Backend Project Setup

**1. Create Backend Project**
```bash
mkdir construction-tracker-api
cd construction-tracker-api
npm init -y
```

**2. Install Dependencies**
```bash
npm install express sequelize pg jsonwebtoken bcrypt cors dotenv
npm install --save-dev nodemon jest supertest
```

**3. Project Structure**
```
construction-tracker-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Project.js
│   │   ├── Site.js
│   │   ├── Item.js
│   │   └── ... (all syncable models)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── syncController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── sync.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

**4. Create `.env` file**
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/construction_tracker
JWT_SECRET=your-secret-key-from-activity-1
NODE_ENV=development
```

**5. PostgreSQL Setup**
```bash
# Install PostgreSQL (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Create database
createdb construction_tracker

# Or via psql
psql -U postgres
CREATE DATABASE construction_tracker;
```

**6. Basic Express Server**

Create `src/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**7. Test Backend**
```bash
node src/server.js
# Visit http://localhost:3000/health
# Should return: {"status":"ok","message":"API is running"}
```

---

### Day 2-3: Sequelize Models & Migrations

**1. Configure Sequelize**

Create `src/config/database.js`:
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
```

**2. Create Project Model**

Create `src/models/Project.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client: DataTypes.STRING,
  start_date: DataTypes.BIGINT, // timestamp
  end_date: DataTypes.BIGINT,
  status: DataTypes.STRING,
  budget: DataTypes.DECIMAL(12, 2),
  _version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: 'projects',
  underscored: true,
  timestamps: true, // creates created_at, updated_at
});

module.exports = Project;
```

**3. Create Site Model**

Create `src/models/Site.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project');

const Site = sequelize.define('Site', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: DataTypes.STRING,
  project_id: {
    type: DataTypes.UUID,
    references: {
      model: Project,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  supervisor_id: DataTypes.UUID,
  _version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: 'sites',
  underscored: true,
  timestamps: true,
});

// Associations
Site.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(Site, { foreignKey: 'project_id' });

module.exports = Site;
```

**4. Sync Database**

Create `src/config/sync.js`:
```javascript
const sequelize = require('./database');
const Project = require('../models/Project');
const Site = require('../models/Site');
// Import all other models...

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    await sequelize.sync({ alter: true });
    console.log('Database synced');
  } catch (error) {
    console.error('Database sync error:', error);
  }
}

syncDatabase();
```

**Run:**
```bash
node src/config/sync.js
```

---

### Day 4-5: First CRUD Endpoints

**1. Create Project Controller**

Create `src/controllers/projectController.js`:
```javascript
const Project = require('../models/Project');

exports.getAllProjects = async (req, res) => {
  try {
    const { updated_after } = req.query;
    const where = {};

    if (updated_after) {
      where.updated_at = { [Op.gt]: new Date(parseInt(updated_after)) };
    }

    const projects = await Project.findAll({ where });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Increment version
    req.body._version = project._version + 1;

    await project.update(req.body);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**2. Create Routes**

Create `src/routes/projects.js`:
```javascript
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth to all routes
router.use(authMiddleware);

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
```

**3. Create Auth Middleware**

Create `src/middleware/authMiddleware.js`:
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**4. Update server.js**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**5. Test with Postman/curl**

```bash
# Login (use Activity 1 JWT)
# Then test:

curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer <your-jwt-token>"

curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "client": "Test Client",
    "status": "active"
  }'
```

---

## 📋 Week 4 Checklist

Use this checklist to track your progress:

### Backend Setup (Days 1-3)
- [ ] Node.js project initialized
- [ ] PostgreSQL installed and database created
- [ ] Sequelize configured
- [ ] Project model created
- [ ] Site model created
- [ ] Database sync working
- [ ] Basic Express server running

### Core API (Days 4-5)
- [ ] Project CRUD endpoints working
- [ ] Site CRUD endpoints working
- [ ] JWT authentication middleware working
- [ ] Pagination implemented
- [ ] Filter by `updated_after` working
- [ ] API tests written (Postman/Jest)

### Production Deployment (Day 5)
- [ ] Backend deployed to Heroku/DigitalOcean/AWS
- [ ] Production database configured
- [ ] Environment variables set
- [ ] API accessible via public URL

---

## 🎯 Success Criteria for Week 4

By the end of Week 4, you should have:

✅ Backend server running (local + production)
✅ PostgreSQL database operational
✅ 2 models working (Project, Site)
✅ CRUD endpoints functional
✅ JWT authentication enforced
✅ API accessible via public URL

---

## 🚨 Common Pitfalls to Avoid

### 1. **Database Connection Issues**
- Make sure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format: `postgresql://user:password@host:port/dbname`
- Test connection: `psql -U postgres -d construction_tracker`

### 2. **JWT Secret Mismatch**
- Use the SAME JWT secret from Activity 1
- Check: `JWT_SECRET` in backend `.env` matches mobile app

### 3. **CORS Errors**
- Configure CORS properly: `app.use(cors())`
- For production, restrict origins: `cors({ origin: 'your-frontend-url' })`

### 4. **Sequelize Model Naming**
- Use `underscored: true` to match snake_case columns
- Column names: `created_at`, `updated_at` (NOT `createdAt`)

### 5. **Version Field**
- Don't forget `_version` field on all syncable models
- Increment on every update: `_version = _version + 1`

---

## 📚 Reference Materials

**Backend Tech Stack:**
- Express.js docs: https://expressjs.com/
- Sequelize docs: https://sequelize.org/
- PostgreSQL docs: https://www.postgresql.org/docs/

**Deployment Options:**
- Heroku: https://www.heroku.com/ (easiest, free tier)
- DigitalOcean: https://www.digitalocean.com/ (cost-effective)
- AWS EC2: https://aws.amazon.com/ec2/ (most control)

**Testing:**
- Postman: https://www.postman.com/
- Jest: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest

---

## 💬 Questions or Issues?

If you encounter any blockers:

1. **Check the troubleshooting section** in `ACTIVITY_2_SYNC_SERVICE_IMPLEMENTATION.md`
2. **Review backend logs** for error details
3. **Test with curl/Postman** to isolate issues
4. **Verify JWT tokens** are valid and not expired

---

## 🎉 Let's Get Started!

**Current Status:** Ready to begin Week 4 (Backend Setup)
**Next Milestone:** Week 4 complete (December 3, 2025)
**Final Goal:** Activity 2 complete (December 10, 2025)

Good luck! 🚀

---

**Document Created:** October 29, 2025
**Activity Start:** October 29, 2025
**Expected Completion:** December 10, 2025

---

**END OF ACTIVITY 2 KICKOFF**
