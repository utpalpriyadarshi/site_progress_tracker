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

      // ✅ Create sample progress report
      await database.write(async () => {
        await database.collections.get('progress_reports').create((report: any) => {
          report.project_id = sampleProject.id;
          report.task_id = sampleProject.id; // adjust if you want real task refs
          report.supervisor_id = 'supervisor-1';
          report.report_date = new Date().getTime();
          report.progress_percentage = 0;
          report.work_completed = 'Project kickoff completed, initial planning done';
          report.issues_identified = 'Weather delays possible in first week';
          report.weather_conditions = 'Sunny, 72°F';
          report.next_day_plan = 'Begin foundation excavation';
          report.photos_count = 0;
          report.status = 'submitted';
        });
      });

      console.log('Default data initialized successfully');
    } catch (error) {
      console.error('Error initializing default data:', error);
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
}
