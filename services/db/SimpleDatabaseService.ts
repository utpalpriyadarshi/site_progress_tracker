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
        });
      });

      // Create sample tasks
      const sampleTasks = [
        { name: 'Foundation Work', priority: 'high', estimated_hours: 240 },
        { name: 'Framing', priority: 'high', estimated_hours: 400 },
        { name: 'Electrical', priority: 'medium', estimated_hours: 180 },
        { name: 'Plumbing', priority: 'medium', estimated_hours: 150 },
        { name: 'Finishing', priority: 'low', estimated_hours: 500 },
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
            taskRecord.estimatedHours = task.estimated_hours;
            taskRecord.assignedTo = 'supervisor-1';
          });
        });
        createdTasks.push(createdTask);
      }

      // Create sample materials
      const sampleMaterials = [
        { name: 'Concrete', category: 'concrete', unit: 'm³', quantity_required: 100, unit_cost: 120 },
        { name: 'Steel Beams', category: 'steel', unit: 'pieces', quantity_required: 50, unit_cost: 500 },
        { name: 'Cement Bags', category: 'cement', unit: 'bags', quantity_required: 200, unit_cost: 15 },
        { name: 'Rebar', category: 'steel', unit: 'kg', quantity_required: 1000, unit_cost: 3 },
        { name: 'Insulation', category: 'insulation', unit: 'sheets', quantity_required: 250, unit_cost: 25 },
      ];

      for (const material of sampleMaterials) {
        await database.write(async () => {
          await database.collections.get('materials').create((materialRecord: any) => {
            materialRecord.projectId = sampleProject.id;
            materialRecord.name = material.name;
            materialRecord.description = `Material: ${material.name}`;
            materialRecord.category = material.category;
            materialRecord.unit = material.unit;
            materialRecord.quantityRequired = material.quantity_required;
            materialRecord.quantityAvailable = material.quantity_required * 0.9;
            materialRecord.quantityUsed = 0;
            materialRecord.unitCost = material.unit_cost;
            materialRecord.status = 'ordered';
            materialRecord.deliveryDate = new Date('2025-01-15').getTime();
            materialRecord.supplier = 'Construction Supply Co.';
          });
        });
      }

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
          });
        });
      }

      console.log('Default data initialized successfully');
    } catch (error) {
      console.error('Error initializing default data:', error);
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
}