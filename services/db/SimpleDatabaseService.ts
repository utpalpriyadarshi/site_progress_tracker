import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import bcrypt from 'react-native-bcrypt';

// A simplified database service that matches the actual schema
export class SimpleDatabaseService {
  /**
   * Helper function to hash passwords with bcrypt
   * Salt rounds: 8 (mobile optimized for performance)
   */
  private static hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 8, (err: Error | undefined, hash: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  static async initializeDefaultData(): Promise<void> {
    try {
      // Check if we already have data to avoid duplicates
      // Check both projects AND users to be thorough
      const projects = await database.collections.get('projects').query().fetch();
      const users = await database.collections.get('users').query().fetch();

      if (projects.length > 0 && users.length > 0) {
        console.log('Default data already exists, skipping initialization');
        console.log(`  - Found ${projects.length} projects and ${users.length} users`);
        return;
      }

      if (projects.length > 0 || users.length > 0) {
        console.log('⚠️  Partial data found! This may indicate incomplete reset.');
        console.log(`  - Projects: ${projects.length}, Users: ${users.length}`);
        console.log('  - Proceeding with initialization...');
      }

      console.log('🚀 Initializing default data...');

      // ✅ Create default roles
      const adminRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'Admin';
          role.description = 'Administrator with full system access';
          role.permissions = JSON.stringify(['all']);
        });
      });

      const supervisorRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'Supervisor';
          role.description = 'Site supervisor managing daily operations';
          role.permissions = JSON.stringify(['view_sites', 'manage_items', 'create_reports', 'view_materials']);
        });
      });

      const managerRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'Manager';
          role.description = 'Project manager overseeing multiple sites';
          role.permissions = JSON.stringify(['view_projects', 'view_sites', 'view_reports', 'manage_team']);
        });
      });

      const plannerRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'Planner';
          role.description = 'Planning specialist for project scheduling';
          role.permissions = JSON.stringify(['view_projects', 'manage_schedule', 'view_items']);
        });
      });

      const logisticsRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'Logistics';
          role.description = 'Logistics coordinator for materials and equipment';
          role.permissions = JSON.stringify(['view_materials', 'manage_materials', 'view_suppliers']);
        });
      });

      const designEngineerRole = await database.write(async () => {
        return await database.collections.get('roles').create((role: any) => {
          role.name = 'DesignEngineer';
          role.description = 'Design engineer managing DOORS packages and design RFQs';
          role.permissions = JSON.stringify(['view_doors', 'manage_doors', 'manage_design_rfqs', 'view_projects']);
        });
      });

      // ✅ Hash passwords for demo users (one-time cost during initialization)
      // Using strong passwords with special characters for better security
      console.log('SimpleDatabaseService: Hashing demo user passwords...');
      const [adminHash, supervisorHash, managerHash, plannerHash, logisticsHash, designEngineerHash] = await Promise.all([
        this.hashPassword('Admin@2025'),
        this.hashPassword('Supervisor@2025'),
        this.hashPassword('Manager@2025'),
        this.hashPassword('Planner@2025'),
        this.hashPassword('Logistics@2025'),
        this.hashPassword('Designer@2025'),
      ]);
      console.log('SimpleDatabaseService: Password hashing complete');

      // ✅ Create default users with hashed passwords
      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'admin';
          user.passwordHash = adminHash;
          user.fullName = 'Admin User';
          user.email = 'admin@construction.com';
          user.phone = '+1234567890';
          user.isActive = true;
          user.roleId = adminRole.id;
        });
      });

      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'supervisor';
          user.passwordHash = supervisorHash;
          user.fullName = 'John Supervisor';
          user.email = 'supervisor@construction.com';
          user.phone = '+1234567891';
          user.isActive = true;
          user.roleId = supervisorRole.id;
        });
      });

      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'manager';
          user.passwordHash = managerHash;
          user.fullName = 'Jane Manager';
          user.email = 'manager@construction.com';
          user.phone = '+1234567892';
          user.isActive = true;
          user.roleId = managerRole.id;
        });
      });

      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'planner';
          user.passwordHash = plannerHash;
          user.fullName = 'Mike Planner';
          user.email = 'planner@construction.com';
          user.phone = '+1234567893';
          user.isActive = true;
          user.roleId = plannerRole.id;
        });
      });

      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'logistics';
          user.passwordHash = logisticsHash;
          user.fullName = 'Sarah Logistics';
          user.email = 'logistics@construction.com';
          user.phone = '+1234567894';
          user.isActive = true;
          user.roleId = logisticsRole.id;
        });
      });

      await database.write(async () => {
        await database.collections.get('users').create((user: any) => {
          user.username = 'designer';
          user.passwordHash = designEngineerHash;
          user.fullName = 'David Design Engineer';
          user.email = 'designer@construction.com';
          user.phone = '+1234567895';
          user.isActive = true;
          user.roleId = designEngineerRole.id;
        });
      });

      console.log('Default roles and users created successfully');

      // ✅ Create default project
      const sampleProject = await database.write(async () => {
        return await database.collections.get('projects').create((project: any) => {
          project.name = 'Sample Construction Project';
          project.client = 'ABC Construction Company';
          project.startDate = new Date('2025-01-01').getTime();
          project.endDate = new Date('2025-12-31').getTime();
          project.status = 'active';
          project.budget = 1000000;
        });
      });

      // ✅ Assign Design Engineer to project (v2.11)
      const designerUsers = await database.collections.get('users').query(Q.where('username', 'designer')).fetch();
      if (designerUsers.length > 0) {
        await database.write(async () => {
          await designerUsers[0].update((user: any) => {
            user.projectId = sampleProject.id;
          });
        });
        console.log('Design Engineer assigned to project:', sampleProject.id);
      }

      // ✅ Create default site
      const sampleSite = await database.write(async () => {
        return await database.collections.get('sites').create((site: any) => {
          site.name = 'Main Construction Site';
          site.location = '123 Main St, Anytown, State';
          site.projectId = sampleProject.id;  // Use camelCase property name
          site.supervisorId = 'supervisor-1';  // Use camelCase property name
          console.log('DEBUG: Creating site with supervisorId:', 'supervisor-1');
        });
      });
      console.log('DEBUG: Site created with ID:', sampleSite.id, 'Raw supervisor_id:', (sampleSite as any)._raw.supervisor_id);

      // ✅ Create default categories
      const foundationCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Foundation Work';
          category.description = 'Foundation construction tasks';
        });
      });

      const framingCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Framing';
          category.description = 'Structural framing tasks';
        });
      });

      const finishingCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Finishing';
          category.description = 'Finishing and detailing tasks';
        });
      });

      const installationCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Installation';
          category.description = 'Installation and assembly tasks';
        });
      });

      const testingCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Testing';
          category.description = 'Testing and quality assurance';
        });
      });

      const commissioningCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Commissioning';
          category.description = 'Commissioning and handover tasks';
        });
      });

      // ✅ Create categories for Mumbai Metro test data
      const civilWorksCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Civil Works';
          category.description = 'Foundation, excavation, concrete works';
        });
      });

      const mepCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'MEP (Mechanical, Electrical, Plumbing)';
          category.description = 'HVAC, electrical systems, plumbing';
        });
      });

      const architecturalFinishesCategory = await database.write(async () => {
        return await database.collections.get('categories').create((category: any) => {
          category.name = 'Architectural Finishes';
          category.description = 'Flooring, wall finishes, ceiling, painting';
        });
      });

      // ✅ Create sample items (construction work items)
      const foundationItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Foundation Excavation';
          item.categoryId = foundationCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 500;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'cubic_meters';
          item.plannedStartDate = new Date('2025-01-15').getTime();
          item.plannedEndDate = new Date('2025-02-15').getTime();
          item.status = 'not_started';
          item.weightage = 20;
        });
      });

      const concretePouringItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Concrete Pouring';
          item.categoryId = foundationCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 300;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'cubic_meters';
          item.plannedStartDate = new Date('2025-02-16').getTime();
          item.plannedEndDate = new Date('2025-03-15').getTime();
          item.status = 'not_started';
          item.weightage = 25;
        });
      });

      const steelFrameworkItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Steel Framework';
          item.categoryId = framingCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 50;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'tons';
          item.plannedStartDate = new Date('2025-03-16').getTime();
          item.plannedEndDate = new Date('2025-04-30').getTime();
          item.status = 'not_started';
          item.weightage = 30;
        });
      });

      const dryWallItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Drywall Installation';
          item.categoryId = finishingCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 1000;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'square_meters';
          item.plannedStartDate = new Date('2025-05-01').getTime();
          item.plannedEndDate = new Date('2025-06-15').getTime();
          item.status = 'not_started';
          item.weightage = 15;
        });
      });

      const electricalItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Electrical Wiring';
          item.categoryId = installationCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 200;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'meters';
          item.plannedStartDate = new Date('2025-04-01').getTime();
          item.plannedEndDate = new Date('2025-05-15').getTime();
          item.status = 'not_started';
          item.weightage = 10;
        });
      });

      const plumbingItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Plumbing Installation';
          item.categoryId = installationCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 150;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'meters';
          item.plannedStartDate = new Date('2025-04-01').getTime();
          item.plannedEndDate = new Date('2025-05-15').getTime();
          item.status = 'not_started';
          item.weightage = 10;
        });
      });

      const roofingItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Roofing Work';
          item.categoryId = framingCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 500;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'square_meters';
          item.plannedStartDate = new Date('2025-05-01').getTime();
          item.plannedEndDate = new Date('2025-06-01').getTime();
          item.status = 'not_started';
          item.weightage = 15;
        });
      });

      const paintingItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Painting & Finishing';
          item.categoryId = finishingCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 1200;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'square_meters';
          item.plannedStartDate = new Date('2025-06-16').getTime();
          item.plannedEndDate = new Date('2025-07-15').getTime();
          item.status = 'not_started';
          item.weightage = 8;
        });
      });

      const flooringItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'Flooring Installation';
          item.categoryId = finishingCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 800;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'square_meters';
          item.plannedStartDate = new Date('2025-06-01').getTime();
          item.plannedEndDate = new Date('2025-07-01').getTime();
          item.status = 'not_started';
          item.weightage = 12;
        });
      });

      const hvacItem = await database.write(async () => {
        return await database.collections.get('items').create((item: any) => {
          item.name = 'HVAC Installation';
          item.categoryId = installationCategory.id;
          item.siteId = sampleSite.id;
          item.plannedQuantity = 20;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'units';
          item.plannedStartDate = new Date('2025-05-15').getTime();
          item.plannedEndDate = new Date('2025-06-30').getTime();
          item.status = 'not_started';
          item.weightage = 12;
        });
      });

      // ✅ Create sample progress log
      await database.write(async () => {
        await database.collections.get('progress_logs').create((log: any) => {
          log.itemId = foundationItem.id;
          log.date = new Date().getTime();
          log.completedQuantity = 0;
          log.reportedBy = 'supervisor-1';
          log.photos = '[]';
          log.notes = 'Initial progress report for foundation excavation';
          log.appSyncStatus = 'pending';
        });
      });

      // ✅ Create sample hindrance
      await database.write(async () => {
        await database.collections.get('hindrances').create((hindrance: any) => {
          hindrance.title = 'Weather Delay';
          hindrance.description = 'Heavy rain expected next week may delay excavation';
          hindrance.itemId = foundationItem.id;
          hindrance.siteId = sampleSite.id;
          hindrance.priority = 'high';
          hindrance.status = 'open';
          hindrance.assignedTo = 'supervisor-1';
          hindrance.reportedBy = 'worker-1';
        });
      });

      // ✅ Create sample materials
      await database.write(async () => {
        await database.collections.get('materials').create((material: any) => {
          material.name = 'Concrete Mix';
          material.itemId = concretePouringItem.id;
          material.quantityRequired = 300;
          material.quantityAvailable = 250;
          material.quantityUsed = 0;
          material.unit = 'cubic_meters';
          material.status = 'ordered';
          material.supplier = 'Local Concrete Supplier';
          material.procurementManagerId = 'procurement-1';
        });
      });

      await database.write(async () => {
        await database.collections.get('materials').create((material: any) => {
          material.name = 'Steel Beams';
          material.itemId = steelFrameworkItem.id;
          material.quantityRequired = 50;
          material.quantityAvailable = 0;
          material.quantityUsed = 0;
          material.unit = 'tons';
          material.status = 'ordered';
          material.supplier = 'Steel Supply Co.';
          material.procurementManagerId = 'procurement-1';
        });
      });

      await database.write(async () => {
        await database.collections.get('materials').create((material: any) => {
          material.name = 'Drywall Sheets';
          material.itemId = dryWallItem.id;
          material.quantityRequired = 1000;
          material.quantityAvailable = 800;
          material.quantityUsed = 0;
          material.unit = 'sheets';
          material.status = 'delivered';
          material.supplier = 'Building Materials Inc.';
          material.procurementManagerId = 'procurement-1';
        });
      });

      // ✅ Create sample vendors (v2.11 Phase 3)
      await database.write(async () => {
        await database.collections.get('vendors').create((vendor: any) => {
          vendor.name = 'ABC Construction Supplies';
          vendor.contactPerson = 'John Smith';
          vendor.email = 'john@abcsupplies.com';
          vendor.phone = '+1234567890';
          vendor.address = '123 Industrial Ave, Construction City';
          vendor.category = 'Materials';
          vendor.rating = 4.5;
          vendor.isActive = true;
        });
      });

      await database.write(async () => {
        await database.collections.get('vendors').create((vendor: any) => {
          vendor.name = 'Global Steel & Metal Co.';
          vendor.contactPerson = 'Sarah Johnson';
          vendor.email = 'sarah@globalsteel.com';
          vendor.phone = '+1234567891';
          vendor.address = '456 Steel Road, Metal Town';
          vendor.category = 'Steel & Metal';
          vendor.rating = 4.8;
          vendor.isActive = true;
        });
      });

      await database.write(async () => {
        await database.collections.get('vendors').create((vendor: any) => {
          vendor.name = 'BuildRight Equipment Rentals';
          vendor.contactPerson = 'Mike Davis';
          vendor.email = 'mike@buildright.com';
          vendor.phone = '+1234567892';
          vendor.address = '789 Equipment Blvd, Tool City';
          vendor.category = 'Equipment';
          vendor.rating = 4.2;
          vendor.isActive = true;
        });
      });

      console.log('Default data initialized successfully');

      // DEBUG: Verify data was created
      const allSites = await database.collections.get('sites').query().fetch();
      const allItems = await database.collections.get('items').query().fetch();
      console.log('DEBUG: Total sites created:', allSites.length);
      console.log('DEBUG: Total items created:', allItems.length);
      allSites.forEach((site: any) => {
        console.log('DEBUG: Site:', site.name, 'supervisor_id:', site.supervisor_id);
      });

      // Test the query that DailyReportsScreen uses
      const supervisorSites = await database.collections.get('sites')
        .query(Q.where('supervisor_id', 'supervisor-1'))
        .fetch();
      console.log('DEBUG: Sites with supervisor_id=supervisor-1:', supervisorSites.length);
    } catch (error) {
      console.error('Error initializing default data:', error);
      throw error;
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

  static async getMaterials(): Promise<any[]> {
    try {
      return await database.collections.get('materials').query().fetch();
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  static async getItemsForSite(siteId: string): Promise<any[]> {
    try {
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
      return await database.collections.get('materials').query(
        Q.where('item_id', itemId)
      ).fetch();
    } catch (error) {
      console.error('Error fetching materials for item:', error);
      return [];
    }
  }
}
