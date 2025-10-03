PLEASE BE SPECIFIC TO CONSTRUCTION INDUSTRY:
- Use construction terminology (Gantt charts, progress tracking, material shortages)
- Consider site supervisors working offline at remote locations
- Include role-specific workflows for construction teams

Prompt 1: Folder Structure

Generate a React Native folder structure for a construction management app with:
- Role-based screen organization (auth/, supervisor/, manager/, planning/)
- Construction-specific component categories
- Offline-first service architecture
- WatermelonDB database setup for construction data

Prompt 2: Navigation Structure

Create a navigation structure for construction management app with:
- Role-based navigators (SupervisorNavigator, ManagerNavigator, PlanningNavigator)
- Authentication flow with role selection
- Tab navigation for role-specific workflows
- Construction-specific screen relationships

Prompt 3: Database Models

Design WatermelonDB models for construction management:
- Project, Site, Category, Item, ProgressLog, Hindrance, Material
- Relationships between construction entities
- Offline sync considerations for site supervisors

PROMPT 4:

Please set up the complete WatermelonDB database for our construction management app with the following models and relationships:

REQUIRED MODELS:
1. Project → has many → Sites
2. Site → has many → Items, belongs to → Project  
3. Category → has many → Items
4. Item → has many → ProgressLogs, belongs to → Site and Category
5. ProgressLog → belongs to → Item, recorded by → User
6. Hindrance → belongs to → Item/Site, assigned to → User
7. Material → belongs to → Item, managed by → Procurement

CONSTRUCTION-SPECIFIC FIELDS:
- Projects: name, client, start_date, end_date, status, budget
- Sites: name, location, project_id, supervisor_id
- Items: name, category_id, site_id, planned_quantity, completed_quantity, unit_of_measurement, planned_start_date, planned_end_date, status, weightage
- ProgressLog: item_id, date, completed_quantity, reported_by, photos[], notes, sync_status
- Hindrance: title, description, item_id, priority, status, assigned_to, reported_by

Please:
1. Update all model files in models/ folder with proper WatermelonDB decorators
2. Update database.ts with all model registrations
3. Create proper migrations for initial setup
4. Ensure offline-sync ready architecture

Return the complete code for each file.