import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';

// A simplified database service that doesn't use decorators directly
// This avoids the TypeScript decorator compatibility issues

export class SimpleDatabaseService {
  static async initializeDefaultData(): Promise<void> {
    try {
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
          site.postalCode = '12345';
          site.status = 'active';
          site.startDate = new Date('2025-01-01').getTime();
          site.endDate = new Date('2025-12-31').getTime();
          site.managerId = 'manager-1';
          site.supervisorId = 'supervisor-1';
          site.description = 'Primary construction site for sample projects';
        });
      });

      // Create default categories
      const materialCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Construction Materials';
          category.description = 'Materials used in construction';
          category.type = 'material';
          category.parentCategoryId = '';
          category.isActive = true;
        });
      });

      const equipmentCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Equipment';
          category.description = 'Construction equipment';
          category.type = 'equipment';
          category.parentCategoryId = '';
          category.isActive = true;
        });
      });

      // Create default project
      const sampleProject = await database.write(async () => {
        return await database.collections.get('projects').create((project: any) => {
          project.name = 'Sample Construction Project';
          project.description = 'This is a sample project for demonstration purposes';
          project.location = '123 Main St, City, State';
          project.status = 'active';
          project.startDate = new Date('2025-01-01').getTime();
          project.endDate = new Date('2025-12-31').getTime();
          project.budget = 1000000;
          project.managerId = 'manager-1';
          project.siteId = sampleSite.id;
        });
      });

      // Create sample tasks
      const sampleTasks = [
        { name: 'Foundation Work', priority: 'high', estimatedHours: 240 },
        { name: 'Framing', priority: 'high', estimatedHours: 400 },
        { name: 'Electrical', priority: 'medium', estimatedHours: 180 },
        { name: 'Plumbing', priority: 'medium', estimatedHours: 150 },
        { name: 'Finishing', priority: 'low', estimatedHours: 500 },
      ];

      const createdTasks: any[] = [];
      for (const task of sampleTasks) {
        const createdTask = await database.write(async () => {
          return await database.collections.get('tasks').create((taskRecord: any) => {
            taskRecord.projectId = sampleProject.id;
            taskRecord.name = task.name;
            taskRecord.description = `Task for ${task.name}`;
            taskRecord.status = 'not_started';
            taskRecord.priority = task.priority;
            taskRecord.startDate = new Date('2025-01-01').getTime();
            taskRecord.endDate = new Date('2025-03-01').getTime();
            taskRecord.estimatedHours = task.estimatedHours;
            taskRecord.assignedTo = 'supervisor-1';
          });
        });
        createdTasks.push(createdTask);
      }

      // Create sample materials
      const sampleMaterials = [
        { name: 'Concrete', category: 'concrete', unit: 'm³', quantityRequired: 100, unitCost: 120 },
        { name: 'Steel Beams', category: 'steel', unit: 'pieces', quantityRequired: 50, unitCost: 500 },
        { name: 'Cement Bags', category: 'cement', unit: 'bags', quantityRequired: 200, unitCost: 15 },
        { name: 'Rebar', category: 'steel', unit: 'kg', quantityRequired: 1000, unitCost: 3 },
        { name: 'Insulation', category: 'insulation', unit: 'sheets', quantityRequired: 250, unitCost: 25 },
      ];

      for (const material of sampleMaterials) {
        await database.write(async () => {
          await database.collections.get('materials').create((materialRecord: any) => {
            materialRecord.projectId = sampleProject.id;
            materialRecord.categoryId = materialCategory.id;
            materialRecord.name = material.name;
            materialRecord.description = `Material: ${material.name}`;
            materialRecord.category = material.category;
            materialRecord.unit = material.unit;
            materialRecord.quantityRequired = material.quantityRequired;
            materialRecord.quantityAvailable = material.quantityRequired * 0.9;
            materialRecord.quantityUsed = 0;
            materialRecord.unitCost = material.unitCost;
            materialRecord.status = 'ordered';
            materialRecord.deliveryDate = new Date('2025-01-15').getTime();
            materialRecord.supplier = 'Construction Supply Co.';
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
            itemRecord.categoryId = equipmentCategory.id;
            itemRecord.projectId = sampleProject.id;
            itemRecord.siteId = sampleSite.id;
            itemRecord.name = item.name;
            itemRecord.description = `Item: ${item.name}`;
            itemRecord.itemCode = item.name.replace(/\s+/g, '_').toUpperCase();
            itemRecord.unit = item.unit;
            itemRecord.quantityAvailable = item.quantityAvailable;
            itemRecord.quantityReserved = 0;
            itemRecord.quantityUsed = 0;
            itemRecord.unitCost = item.unitCost;
            itemRecord.status = 'in_stock';
            itemRecord.supplier = 'Safety Supply Co.';
            itemRecord.deliveryDate = new Date('2025-01-10').getTime();
            itemRecord.location = 'Warehouse A';
          });
        });
      }

      // Create sample progress logs
      for (const task of createdTasks.slice(0, 2)) { // Create logs for first 2 tasks
        await database.write(async () => {
          await database.collections.get('progress_logs').create((log: any) => {
            log.projectId = sampleProject.id;
            log.taskId = task.id;
            log.siteId = sampleSite.id;
            log.supervisorId = 'supervisor-1';
            log.logDate = new Date().getTime();
            log.progressPercentage = 0;
            log.workCompleted = `Initial work on ${task.name}`;
            log.workPlanned = `Continue work on ${task.name}`;
            log.actualVsPlanned = 'On schedule';
            log.weatherConditions = 'Sunny, 72°F';
            log.personnelCount = 5;
            log.safetyIncidents = 'None';
            log.qualityIssues = 'None';
            log.nextDayPlan = `Continue work on ${task.name}`;
            log.photosCount = 2;
            log.status = 'submitted';
          });
        });
      }

      // Create sample hindrance
      await database.write(async () => {
        await database.collections.get('hindrances').create((hindrance: any) => {
          hindrance.projectId = sampleProject.id;
          hindrance.taskId = createdTasks[0].id;
          hindrance.siteId = sampleSite.id;
          hindrance.reporterId = 'supervisor-1';
          hindrance.title = 'Material Delay';
          hindrance.description = 'Delivery of steel beams delayed by 3 days';
          hindrance.type = 'supply_shortage';
          hindrance.severity = 'high';
          hindrance.status = 'reported';
          hindrance.reportedDate = new Date().getTime();
          hindrance.impactOnSchedule = 3;
          hindrance.costImpact = 5000;
          hindrance.affectedResources = 'Foundation Work, Steel Beams';
          hindrance.resolutionNotes = 'Alternative supplier contacted';
          hindrance.assignedTo = 'manager-1';
        });
      });

      // Create sample progress report (linked to the first created task)
      const firstTask = createdTasks[0];
      if (firstTask) {
        await database.write(async () => {
          await database.collections.get('progress_reports').create((reportRecord: any) => {
            reportRecord.projectId = sampleProject.id;
            reportRecord.taskId = firstTask.id;
            reportRecord.supervisorId = 'supervisor-1';
            reportRecord.reportDate = new Date().getTime();
            reportRecord.progressPercentage = 0;
            reportRecord.workCompleted = 'Project kickoff completed, initial planning done';
            reportRecord.issuesIdentified = 'Weather delays possible in first week';
            reportRecord.weatherConditions = 'Sunny, 72°F';
            reportRecord.nextDayPlan = 'Begin foundation excavation';
            reportRecord.photosCount = 0;
            reportRecord.status = 'submitted';
            reportRecord.summary = 'Initial project status report';
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
      return await database.collections.get('sites').query().fetch();
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  }

  static async getProjects(): Promise<any[]> {
    try {
      return await database.collections.get('projects').query().fetch();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getCategories(): Promise<any[]> {
    try {
      return await database.collections.get('categories').query().fetch();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  static async getItems(): Promise<any[]> {
    try {
      return await database.collections.get('items').query().fetch();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  static async getHindrances(): Promise<any[]> {
    try {
      return await database.collections.get('hindrances').query().fetch();
    } catch (error) {
      console.error('Error fetching hindrances:', error);
      return [];
    }
  }

  static async getProgressLogs(): Promise<any[]> {
    try {
      return await database.collections.get('progress_logs').query().fetch();
    } catch (error) {
      console.error('Error fetching progress logs:', error);
      return [];
    }
  }

  static async getTasksForProject(projectId: string): Promise<any[]> {
    try {
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
      return await database.collections.get('progress_logs').query(
        Q.where('task_id', taskId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching progress logs for task:', error);
      return [];
    }
  }
}