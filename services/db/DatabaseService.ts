import { Q } from '@nozbe/watermelondb';
import { Database } from '@nozbe/watermelondb';

// Delay the import of database to avoid initialization issues
let _database: Database | null = null;

const getDatabase = async (): Promise<Database> => {
  if (!_database) {
    const dbModule = await import('../../models/database');
    _database = dbModule.database;
  }
  return _database;
};

export class DatabaseService {
  static async initializeDefaultData(): Promise<void> {
    try {
      const database = await getDatabase();

      // Check if we already have data to avoid duplicates
      const projects = await database.collections.get('projects').query().fetch();
      if (projects.length > 0) {
        console.log('Default data already exists, skipping initialization');
        return;
      }

      // Create default site
      const sampleSite = await database.write(async () => {
        return await database.collections.get('sites').create((site: any) => {
          site.name = 'Main Construction Site';
          site.address = '123 Main St';
          site.city = 'Anytown';
          site.state = 'CA';
          site.country = 'USA';
          site.postal_code = '12345';
          site.status = 'active';
          site.start_date = new Date('2025-01-01').getTime();
          site.end_date = new Date('2025-12-31').getTime();
          site.manager_id = 'manager-1';
          site.supervisor_id = 'supervisor-1';
          site.description = 'Primary construction site for sample projects';
        });
      });

      // Create default categories
      const materialCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Construction Materials';
          category.description = 'Materials used in construction';
          category.type = 'material';
          category.parent_category_id = '';
          category.is_active = true;
        });
      });

      const equipmentCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Equipment';
          category.description = 'Construction equipment';
          category.type = 'equipment';
          category.parent_category_id = '';
          category.is_active = true;
        });
      });

      // ✅ Create default project
      const sampleProject = await database.write(async () => {
        return await database.collections.get('projects').create((project: any) => {
          project.name = 'Sample Construction Project';
          project.description = 'This is a sample project for demonstration purposes';
          project.location = '123 Main St, City, State';
          project.status = 'active';
          project.start_date = new Date('2025-01-01').getTime();
          project.end_date = new Date('2025-12-31').getTime();
          project.budget = 1000000;
          project.manager_id = 'manager-1';
          project.site_id = sampleSite.id;
        });
      });

      // ✅ Create sample tasks for the project
      const sampleTasks = [
        { name: 'Foundation Work', priority: 'high', estimatedHours: 240 },
        { name: 'Framing', priority: 'high', estimatedHours: 400 },
        { name: 'Electrical', priority: 'medium', estimatedHours: 180 },
        { name: 'Plumbing', priority: 'medium', estimatedHours: 150 },
        { name: 'Finishing', priority: 'low', estimatedHours: 500 },
      ];

      for (const task of sampleTasks) {
        await database.write(async () => {
          await database.collections.get('tasks').create((taskRecord: any) => {
            taskRecord.project_id = sampleProject.id;
            taskRecord.name = task.name;
            taskRecord.description = `Task for ${task.name}`;
            taskRecord.status = 'not_started';
            taskRecord.priority = task.priority;
            taskRecord.start_date = new Date('2025-01-01').getTime();
            taskRecord.end_date = new Date('2025-03-01').getTime();
            taskRecord.estimated_hours = task.estimatedHours;
            taskRecord.assigned_to = 'supervisor-1';
          });
        });
      }

      // ✅ Create sample materials
      const sampleMaterials = [
        { name: 'Concrete', category: 'concrete', unit: 'm³', quantityRequired: 100, unitCost: 120 },
        { name: 'Steel Beams', category: 'steel', unit: 'pieces', quantityRequired: 50, unitCost: 500 },
        { name: 'Cement Bags', category: 'cement', unit: 'bags', quantityRequired: 200, unitCost: 15 },
        { name: 'Rebar', category: 'steel', unit: 'kg', quantityRequired: 1000, unitCost: 3 },
        { name: 'Insulation', category: 'insulation', unit: 'sheets', quantityRequired: 250, unitCost: 25 },
      ];

      for (const material of sampleMaterials) {
        await database.write(async () => {
          await database.collections.get('materials').create((newMaterial: any) => {
            newMaterial.project_id = sampleProject.id;
            newMaterial.category_id = materialCategory.id;
            newMaterial.name = material.name;
            newMaterial.description = `Material: ${material.name}`;
            newMaterial.category = material.category;
            newMaterial.unit = material.unit;
            newMaterial.quantity_required = material.quantityRequired;
            newMaterial.quantity_available = material.quantityRequired * 0.9;
            newMaterial.quantity_used = 0;
            newMaterial.unit_cost = material.unitCost;
            newMaterial.status = 'ordered';
            newMaterial.delivery_date = new Date('2025-01-15').getTime();
            newMaterial.supplier = 'Construction Supply Co.';
          });
        });
      }

      // Create sample items
      const sampleItems = [
        { name: 'Safety Helmets', unit: 'pieces', quantityAvailable: 100, unitCost: 20 },
        { name: 'Work Gloves', unit: 'pairs', quantityAvailable: 150, unitCost: 5 },
        { name: 'Tool Kit', unit: 'sets', quantityAvailable: 10, unitCost: 150 },
      ];

      for (const item of sampleItems) {
        await database.write(async () => {
          await database.collections.get('items').create((itemRecord: any) => {
            itemRecord.category_id = equipmentCategory.id;
            itemRecord.project_id = sampleProject.id;
            itemRecord.site_id = sampleSite.id;
            itemRecord.name = item.name;
            itemRecord.description = `Item: ${item.name}`;
            itemRecord.item_code = item.name.replace(/\s+/g, '_').toUpperCase();
            itemRecord.unit = item.unit;
            itemRecord.quantity_available = item.quantityAvailable;
            itemRecord.quantity_reserved = 0;
            itemRecord.quantity_used = 0;
            itemRecord.unit_cost = item.unitCost;
            itemRecord.status = 'in_stock';
            itemRecord.supplier = 'Safety Supply Co.';
            itemRecord.delivery_date = new Date('2025-01-10').getTime();
            itemRecord.location = 'Warehouse A';
          });
        });
      }

      // Create sample progress logs
      const tasks = await database.collections.get('tasks').query(
        Q.where('project_id', sampleProject.id)
      ).fetch();
      
      for (let i = 0; i < Math.min(2, tasks.length); i++) { // Create logs for first 2 tasks
        const task = tasks[i];
        await database.write(async () => {
          await database.collections.get('progress_logs').create((log: any) => {
            log.project_id = sampleProject.id;
            log.task_id = task.id;
            log.site_id = sampleSite.id;
            log.supervisor_id = 'supervisor-1';
            log.log_date = new Date().getTime();
            log.progress_percentage = 0;
            log.work_completed = `Initial work on ${task.id}`;
            log.work_planned = `Continue work on ${task.id}`;
            log.actual_vs_planned = 'On schedule';
            log.weather_conditions = 'Sunny, 72°F';
            log.personnel_count = 5;
            log.safety_incidents = 'None';
            log.quality_issues = 'None';
            log.next_day_plan = `Continue work on ${task.id}`;
            log.photos_count = 2;
            log.status = 'submitted';
          });
        });
      }

      // Create sample hindrance
      if (tasks.length > 0) {
        await database.write(async () => {
          await database.collections.get('hindrances').create((hindrance: any) => {
            hindrance.project_id = sampleProject.id;
            hindrance.task_id = tasks[0].id;
            hindrance.site_id = sampleSite.id;
            hindrance.reporter_id = 'supervisor-1';
            hindrance.title = 'Material Delay';
            hindrance.description = 'Delivery of steel beams delayed by 3 days';
            hindrance.type = 'supply_shortage';
            hindrance.severity = 'high';
            hindrance.status = 'reported';
            hindrance.reported_date = new Date().getTime();
            hindrance.impact_on_schedule = 3;
            hindrance.cost_impact = 5000;
            hindrance.affected_resources = `Foundation Work, Steel Beams`;
            hindrance.resolution_notes = 'Alternative supplier contacted';
            hindrance.assigned_to = 'manager-1';
          });
        });
      }

      // ✅ Create sample progress report
      if (tasks.length > 0) {
        await database.write(async () => {
          await database.collections.get('progress_reports').create((report: any) => {
            report.project_id = sampleProject.id;
            report.task_id = tasks[0].id;
            report.supervisor_id = 'supervisor-1';
            report.report_date = new Date().getTime();
            report.progress_percentage = 0;
            report.work_completed = 'Project kickoff completed, initial planning done';
            report.issues_identified = 'Weather delays possible in first week';
            report.weather_conditions = 'Sunny, 72°F';
            report.next_day_plan = 'Begin foundation excavation';
            report.photos_count = 0;
            report.status = 'submitted';
            report.summary = 'Initial project status report';
          });
        });
      }

      console.log('Default data initialized successfully');
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  static async getSites(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('sites').query().fetch();
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  }

  static async getProjects(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('projects').query().fetch();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getCategories(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('categories').query().fetch();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  static async getItems(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('items').query().fetch();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  static async getHindrances(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('hindrances').query().fetch();
    } catch (error) {
      console.error('Error fetching hindrances:', error);
      return [];
    }
  }

  static async getProgressLogs(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('progress_logs').query().fetch();
    } catch (error) {
      console.error('Error fetching progress logs:', error);
      return [];
    }
  }

  static async getTasksForProject(projectId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('tasks').query(
        Q.where('project_id', projectId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async getMaterialsForProject(projectId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('materials').query(
        Q.where('project_id', projectId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  static async getItemsForProject(projectId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('items').query(
        Q.where('project_id', projectId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  static async getHindrancesForProject(projectId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('hindrances').query(
        Q.where('project_id', projectId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching hindrances for project:', error);
      return [];
    }
  }

  static async getProgressLogsForProject(projectId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('progress_logs').query(
        Q.where('project_id', projectId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching progress logs for project:', error);
      return [];
    }
  }

  static async getProgressLogsForTask(taskId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('progress_logs').query(
        Q.where('task_id', taskId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching progress logs for task:', error);
      return [];
    }
  }
}
