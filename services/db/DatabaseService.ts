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
          project.client = 'ABC Construction Company';
          project.start_date = new Date('2025-01-01').getTime();
          project.end_date = new Date('2025-12-31').getTime();
          project.status = 'active';
          project.budget = 1000000;
        });
      });

      // Create default site
      const sampleSite = await database.write(async () => {
        return await database.collections.get('sites').create((site: any) => {
          site.name = 'Main Construction Site';
          site.location = '123 Main St, Anytown, State';
          site.project_id = sampleProject.id;
          site.supervisor_id = 'supervisor-1';
        });
      });

      // Create default category
      const constructionCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Foundation Work';
          category.description = 'Foundation construction tasks';
        });
      });

      // Create sample item
      const foundationItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Foundation Excavation';
          item.category_id = constructionCategory.id;
          item.site_id = sampleSite.id;
          item.planned_quantity = 500; // cubic meters
          item.completed_quantity = 0;
          item.unit_of_measurement = 'cubic_meters';
          item.planned_start_date = new Date('2025-01-15').getTime();
          item.planned_end_date = new Date('2025-02-15').getTime();
          item.status = 'not_started';
          item.weightage = 15; // 15% of project
        });
      });

      // Create sample progress log
      await database.write(async () => {
        await database.collections.get('progress_logs').create((log: any) => {
          log.item_id = foundationItem.id;
          log.date = new Date().getTime();
          log.completed_quantity = 0;
          log.reported_by = 'supervisor-1';
          log.photos = '[]'; // JSON string of photo paths
          log.notes = 'Initial progress report for foundation excavation';
          log.sync_status = 'pending';
        });
      });

      // Create sample hindrance
      await database.write(async () => {
        await database.collections.get('hindrances').create((hindrance: any) => {
          hindrance.title = 'Weather Delay';
          hindrance.description = 'Rainy weather delaying foundation excavation';
          hindrance.item_id = foundationItem.id;
          hindrance.site_id = sampleSite.id;
          hindrance.priority = 'high';
          hindrance.status = 'open';
          hindrance.assigned_to = 'supervisor-1';
          hindrance.reported_by = 'worker-1';
        });
      });

      // Create sample material
      await database.write(async () => {
        await database.collections.get('materials').create((material: any) => {
          material.name = 'Concrete Mix';
          material.item_id = foundationItem.id;
          material.quantity_required = 100; // cubic meters
          material.quantity_available = 80;
          material.quantity_used = 0;
          material.unit = 'cubic_meters';
          material.status = 'ordered';
          material.supplier = 'Local Concrete Supplier';
          material.procurement_manager_id = 'procurement-1';
        });
      });

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

  static async getMaterials(): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('materials').query().fetch();
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  static async getItemsForSite(siteId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('items').query(
        Q.where('site_id', siteId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching items for site:', error);
      return [];
    }
  }

  static async getHindrancesForItem(itemId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('hindrances').query(
        Q.where('item_id', itemId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching hindrances for item:', error);
      return [];
    }
  }

  static async getHindrancesForSite(siteId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('hindrances').query(
        Q.where('site_id', siteId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching hindrances for site:', error);
      return [];
    }
  }

  static async getProgressLogsForItem(itemId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('progress_logs').query(
        Q.where('item_id', itemId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching progress logs for item:', error);
      return [];
    }
  }

  static async getMaterialsForItem(itemId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('materials').query(
        Q.where('item_id', itemId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching materials for item:', error);
      return [];
    }
  }

  static async getItemsForCategory(categoryId: string): Promise<any[]> {
    try {
      const database = await getDatabase();
      return await database.collections.get('items').query(
        Q.where('category_id', categoryId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching items for category:', error);
      return [];
    }
  }
}
