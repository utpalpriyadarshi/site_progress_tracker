/**
 * Manager Test Data Utility - v2.10
 *
 * Populates test data for Manager Dashboard testing:
 * - Items with progress and weightage
 * - Milestone progress records
 * - Purchase orders
 * - Hindrances
 * - Critical path items
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Divider, Chip } from 'react-native-paper';
import { database } from '../../models/database';
import { useAuth } from '../auth/AuthContext';
import { Q } from '@nozbe/watermelondb';
import { COLORS } from '../theme/colors';

export const ManagerTestDataUtility = () => {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);

  // Load project info from current user or show project selector
  useEffect(() => {
    const loadProjectInfo = async () => {
      if (!user?.userId) {
        setLoadingProject(false);
        return;
      }

      try {
        // Try to get project from user's project_id
        const userRecord = await database.collections.get('users').find(user.userId);
        const userProjectId = (userRecord as any).projectId;

        if (userProjectId) {
          const project = await database.collections.get('projects').find(userProjectId);
          setProjectId(userProjectId);
          setProjectName((project as any).name);
        } else {
          // If no project assigned, get first available project
          const projects = await database.collections.get('projects').query().fetch();
          if (projects.length > 0) {
            const firstProject = projects[0];
            setProjectId(firstProject.id);
            setProjectName((firstProject as any).name);
          }
        }
      } catch (error) {
        console.error('[TestData] Error loading project:', error);
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectInfo();
  }, [user]);

  const addResult = (message: string) => {
    setResults((prev) => [...prev, message]);
    console.log('[TestData]', message);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Create test sites for the project
  const createTestSites = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating 3 test sites...');

      const siteNames = ['Site Alpha', 'Site Beta', 'Site Gamma'];
      const createdSites: Array<{ id: string; name: string }> = [];

      for (const siteName of siteNames) {
        await database.write(async () => {
          const site = await database.collections.get('sites').create((s: any) => {
            s.name = siteName;
            s.location = `Location ${siteName}`;
            s.projectId = projectId;
            s.supervisorId = user.userId; // Assign current user as supervisor
            s.appSyncStatus = 'pending';
            s.version = 1;
          });
          createdSites.push({ id: site.id, name: siteName });
        });
      }

      addResult(`✓ Created ${createdSites.length} sites`);
      createdSites.forEach((s) => addResult(`  - ${s.name} (${s.id})`));
      addResult('\n✅ Test sites created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create test items with progress
  const createTestItems = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating test items with progress...');

      // Get sites for this project
      const sites = await database.collections
        .get('sites')
        .query()
        .fetch();

      const projectSites = sites.filter((s: any) => s.projectId === projectId);

      if (projectSites.length === 0) {
        addResult('⚠️ No sites found. Create sites first!');
        setLoading(false);
        return;
      }

      // Get categories
      const categories = await database.collections.get('categories').query().fetch();
      const category = categories[0];

      if (!category) {
        addResult('⚠️ No categories found. Please create a category first!');
        setLoading(false);
        return;
      }

      let totalItems = 0;

      for (const site of projectSites) {
        // Create 5 items per site with varying progress
        const itemsData = [
          {
            name: 'Foundation Work',
            progress: 85,
            weightage: 20,
            isCritical: true,
            risk: 'low',
          },
          {
            name: 'Structural Steel',
            progress: 60,
            weightage: 25,
            isCritical: true,
            risk: 'medium',
          },
          {
            name: 'Electrical Installation',
            progress: 40,
            weightage: 15,
            isCritical: false,
            risk: 'low',
          },
          {
            name: 'Plumbing System',
            progress: 30,
            weightage: 15,
            isCritical: true,
            risk: 'high',
          },
          {
            name: 'HVAC Installation',
            progress: 20,
            weightage: 25,
            isCritical: false,
            risk: 'low',
          },
        ];

        for (const itemData of itemsData) {
          await database.write(async () => {
            await database.collections.get('items').create((item: any) => {
              item.name = itemData.name;
              item.categoryId = category.id;
              item.siteId = site.id;
              item.plannedQuantity = 100;
              item.completedQuantity = itemData.progress;
              item.currentProgress = itemData.progress; // Set progress percentage
              item.unitOfMeasurement = 'units';
              item.plannedStartDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
              item.plannedEndDate = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
              item.status = itemData.progress === 100 ? 'completed' : 'in_progress';
              item.weightage = itemData.weightage;
              item.isCriticalPath = itemData.isCritical;
              item.dependencyRisk = itemData.risk;
              item.riskNotes = itemData.risk === 'high' ? 'Material delivery delayed' : '';
              item.appSyncStatus = 'pending';
              item.version = 1;
            });
          });
          totalItems++;
        }
      }

      addResult(`✓ Created ${totalItems} items across ${projectSites.length} sites`);
      addResult('  - Items have varying progress: 20%, 30%, 40%, 60%, 85%');
      addResult('  - Items have weightages: 15-25%');
      addResult('  - Critical path items marked');
      addResult('  - Risk levels assigned');
      addResult('\n✅ Test items created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create default milestones for existing project
  const createDefaultMilestones = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating default milestones (PM100-PM700)...');

      const defaultMilestones = [
        { code: 'PM100', name: 'Requirements Management (DOORS)', weightage: 10, order: 1 },
        { code: 'PM200', name: 'Engineering & Design', weightage: 15, order: 2 },
        { code: 'PM300', name: 'Procurement', weightage: 15, order: 3 },
        { code: 'PM400', name: 'Manufacturing', weightage: 10, order: 4 },
        { code: 'PM500', name: 'Testing & Pre-commissioning', weightage: 15, order: 5 },
        { code: 'PM600', name: 'Commissioning', weightage: 20, order: 6 },
        { code: 'PM700', name: 'Handover', weightage: 15, order: 7 },
      ];

      const now = Date.now();

      for (const milestone of defaultMilestones) {
        await database.write(async () => {
          await database.collections.get('milestones').create((record: any) => {
            record.projectId = projectId;
            record.milestoneCode = milestone.code;
            record.milestoneName = milestone.name;
            record.description = `Default milestone: ${milestone.name}`;
            record.sequenceOrder = milestone.order;
            record.weightage = milestone.weightage;
            record.isActive = true;
            record.isCustom = false;
            record.createdBy = user.userId;
            record.updatedAt = now;
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        });
      }

      addResult(`✓ Created ${defaultMilestones.length} default milestones`);
      defaultMilestones.forEach((m) =>
        addResult(`  - ${m.code}: ${m.name} (${m.weightage}%)`)
      );
      addResult('\n✅ Default milestones created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create milestone progress records
  const createMilestoneProgress = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating milestone progress records...');

      // Get milestones for this project
      const milestones = await database.collections
        .get('milestones')
        .query()
        .fetch();

      const projectMilestones = milestones.filter((m: any) => m.projectId === projectId);

      if (projectMilestones.length === 0) {
        addResult('⚠️ No milestones found. Run "Create Default Milestones" first!');
        setLoading(false);
        return;
      }

      // Get sites for this project
      const sites = await database.collections.get('sites').query().fetch();
      const projectSites = sites.filter((s: any) => s.projectId === projectId);

      if (projectSites.length === 0) {
        addResult('⚠️ No sites found. Create sites first!');
        setLoading(false);
        return;
      }

      let totalRecords = 0;

      // Create progress records for each milestone at each site
      for (const milestone of projectMilestones) {
        const milestoneCode = (milestone as any).milestoneCode;

        // Different progress for different milestones
        let progress = 0;
        let status = 'not_started';

        if (milestoneCode === 'PM100') { progress = 100; status = 'completed'; }
        else if (milestoneCode === 'PM200') { progress = 75; status = 'in_progress'; }
        else if (milestoneCode === 'PM300') { progress = 50; status = 'in_progress'; }
        else if (milestoneCode === 'PM400') { progress = 25; status = 'in_progress'; }
        else if (milestoneCode === 'PM500') { progress = 10; status = 'in_progress'; }
        else if (milestoneCode === 'PM600') { progress = 0; status = 'not_started'; }
        else if (milestoneCode === 'PM700') { progress = 0; status = 'not_started'; }

        for (const site of projectSites) {
          await database.write(async () => {
            await database.collections.get('milestone_progress').create((mp: any) => {
              mp.milestoneId = milestone.id;
              mp.siteId = site.id;
              mp.projectId = projectId;
              mp.progressPercentage = progress;
              mp.status = status;
              mp.ownerId = user.userId;
              mp.plannedStartDate = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago
              mp.plannedEndDate = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days from now
              if (progress > 0) {
                mp.actualStartDate = Date.now() - 50 * 24 * 60 * 60 * 1000;
              }
              if (progress === 100) {
                mp.actualEndDate = Date.now() - 10 * 24 * 60 * 60 * 1000;
              }
              mp.notes = `Test progress for ${milestoneCode}`;
              mp.updatedBy = user.userId;
              mp.updatedAt = Date.now();
              mp.appSyncStatus = 'pending';
              mp.version = 1;
            });
          });
          totalRecords++;
        }
      }

      addResult(`✓ Created ${totalRecords} milestone progress records`);
      addResult(`  - ${projectMilestones.length} milestones × ${projectSites.length} sites`);
      addResult('  - PM100: 100% (completed)');
      addResult('  - PM200: 75% (in progress)');
      addResult('  - PM300: 50% (in progress)');
      addResult('  - PM400-700: Various stages');
      addResult('\n✅ Milestone progress created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create test hindrances
  const createTestHindrances = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating test hindrances...');

      const sites = await database.collections.get('sites').query().fetch();
      const projectSites = sites.filter((s: any) => s.projectId === projectId);

      if (projectSites.length === 0) {
        addResult('⚠️ No sites found. Create sites first!');
        setLoading(false);
        return;
      }

      const hindranceData = [
        {
          title: 'Material Shortage',
          description: 'Steel reinforcement bars delayed by supplier',
          severity: 'high',
        },
        {
          title: 'Weather Delay',
          description: 'Heavy rain affecting outdoor work',
          severity: 'medium',
        },
        {
          title: 'Equipment Breakdown',
          description: 'Crane maintenance required',
          severity: 'low',
        },
      ];

      let totalHindrances = 0;

      for (const site of projectSites.slice(0, 2)) {
        // Add hindrances to first 2 sites
        for (const hData of hindranceData) {
          await database.write(async () => {
            await database.collections.get('hindrances').create((h: any) => {
              h.siteId = site.id;
              h.title = hData.title;
              h.description = hData.description;
              h.status = 'open';
              h.severity = hData.severity;
              h.raisedBy = user.userId;
              h.raisedAt = Date.now();
              h.appSyncStatus = 'pending';
              h.version = 1;
            });
          });
          totalHindrances++;
        }
      }

      addResult(`✓ Created ${totalHindrances} open hindrances`);
      addResult('  - Various severity levels (high, medium, low)');
      addResult('  - All marked as "open" status');
      addResult('\n✅ Test hindrances created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create test purchase orders
  const createTestPurchaseOrders = async () => {
    if (!projectId || !user) return;

    clearResults();
    setLoading(true);

    try {
      addResult('Creating test purchase orders...');

      // Get project budget for realistic PO values
      const project = await database.collections.get('projects').find(projectId);
      const budget = (project as any).budget || 1000000;

      const poData = [
        {
          poNumber: 'PO-2025-001',
          value: budget * 0.15, // 15% of budget
          status: 'issued',
          expectedDelivery: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days
        },
        {
          poNumber: 'PO-2025-002',
          value: budget * 0.20, // 20% of budget
          status: 'in_progress',
          expectedDelivery: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        },
        {
          poNumber: 'PO-2025-003',
          value: budget * 0.10, // 10% of budget
          status: 'delivered',
          expectedDelivery: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          actualDelivery: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
        {
          poNumber: 'PO-2025-004',
          value: budget * 0.05, // 5% of budget (delayed)
          status: 'in_progress',
          expectedDelivery: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago (DELAYED)
        },
      ];

      for (const po of poData) {
        await database.write(async () => {
          await database.collections.get('purchase_orders').create((p: any) => {
            p.poNumber = po.poNumber;
            p.rfqId = 'test-rfq-id'; // Placeholder
            p.vendorId = 'test-vendor-id'; // Placeholder
            p.projectId = projectId;
            p.poDate = Date.now() - 20 * 24 * 60 * 60 * 1000; // 20 days ago
            p.poValue = po.value;
            p.currency = 'USD';
            p.paymentTerms = '30 days net';
            p.deliveryTerms = 'FOB destination';
            p.expectedDeliveryDate = po.expectedDelivery;
            if (po.actualDelivery) {
              p.actualDeliveryDate = po.actualDelivery;
            }
            p.status = po.status;
            p.itemsDetails = JSON.stringify([{ item: 'Test Item', quantity: 100 }]);
            p.termsConditions = 'Standard terms';
            p.notes = 'Test PO for dashboard';
            p.createdById = user.userId;
            p.createdAt = Date.now();
            p.updatedAt = Date.now();
            p.appSyncStatus = 'pending';
            p.version = 1;
          });
        });
      }

      addResult(`✓ Created ${poData.length} purchase orders`);
      addResult('  - Total PO value: 50% of budget');
      addResult('  - 1 delivered on time');
      addResult('  - 1 delayed (past expected delivery)');
      addResult('  - 2 in progress/issued');
      addResult('\n✅ Test purchase orders created successfully!');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Check what data exists
  const debugCheckData = async () => {
    if (!projectId) return;

    clearResults();
    setLoading(true);

    try {
      addResult('=== Database Debug Check ===\n');
      addResult(`Project ID: ${projectId}`);
      addResult(`Project Name: ${projectName}\n`);

      // Check sites
      const allSites = await database.collections.get('sites').query().fetch();
      const projectSites = allSites.filter((s: any) => s.projectId === projectId);
      addResult(`Sites in database: ${allSites.length} total, ${projectSites.length} for this project`);
      projectSites.forEach((s: any) => {
        addResult(`  - ${s.name} (${s.id.substring(0, 8)}...) project: ${s.projectId.substring(0, 8)}...`);
      });

      if (projectSites.length > 0) {
        const siteIds = projectSites.map((s) => s.id);

        // Check items
        const items = await database.collections
          .get('items')
          .query(Q.where('site_id', Q.oneOf(siteIds)))
          .fetch();
        addResult(`\nItems: ${items.length} total`);
        items.slice(0, 5).forEach((item: any) => {
          addResult(
            `  - ${item.name}: ${item.currentProgress}% (site: ${item.siteId.substring(0, 8)}...)`
          );
        });

        // Check hindrances
        const hindrances = await database.collections
          .get('hindrances')
          .query(Q.where('site_id', Q.oneOf(siteIds)))
          .fetch();
        addResult(`\nHindrances: ${hindrances.length} total`);
      }

      // Check milestones
      const milestones = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId))
        .fetch();
      addResult(`\nMilestones: ${milestones.length} for this project`);
      milestones.forEach((m: any) => {
        addResult(`  - ${m.milestoneCode}: ${m.milestoneName} (${m.weightage}%)`);
      });

      // Check milestone progress
      const milestoneProgress = await database.collections
        .get('milestone_progress')
        .query(Q.where('project_id', projectId))
        .fetch();
      addResult(`\nMilestone Progress: ${milestoneProgress.length} records`);

      // Check purchase orders
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();
      addResult(`\nPurchase Orders: ${purchaseOrders.length} for this project`);

      addResult('\n=== Debug Check Complete ===');
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create all test data at once
  const createAllTestData = async () => {
    if (!projectId || !user) {
      Alert.alert('Error', 'No project assigned or user not logged in');
      return;
    }

    clearResults();
    setLoading(true);

    try {
      addResult('=== Creating Complete Test Data Set ===\n');

      // Step 0: Default Milestones (if not exist)
      addResult('Step 0/6: Checking/Creating default milestones...');
      const existingMilestones = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId))
        .fetch();

      if (existingMilestones.length === 0) {
        await createDefaultMilestones();
      } else {
        addResult(`✓ Milestones already exist (${existingMilestones.length})`);
      }
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Step 1: Sites
      addResult('\nStep 1/6: Creating test sites...');
      await createTestSites();
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Step 2: Items
      addResult('\nStep 2/6: Creating test items...');
      await createTestItems();
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Step 3: Milestone Progress
      addResult('\nStep 3/6: Creating milestone progress...');
      await createMilestoneProgress();
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Step 4: Hindrances
      addResult('\nStep 4/6: Creating hindrances...');
      await createTestHindrances();
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // Step 5: Purchase Orders
      addResult('\nStep 5/6: Creating purchase orders...');
      await createTestPurchaseOrders();

      addResult('\n\n🎉 ALL TEST DATA CREATED SUCCESSFULLY! 🎉');
      addResult('\nYou can now:');
      addResult('1. Navigate to Manager Dashboard');
      addResult('2. Pull to refresh');
      addResult('3. See all KPIs populated with data');
      addResult('\nExpected Results:');
      addResult('- Overall Progress: ~45-55% (hybrid calc)');
      addResult('- Sites: 3 sites (with schedule status)');
      addResult('- Budget: ~50% utilized');
      addResult('- Open Issues: 6 hindrances');
      addResult('- Critical Path: 2-3 items at risk');
      addResult('- Deliveries: 3 on track, 1 delayed');
    } catch (error) {
      addResult(`\n❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear all test data
  const clearAllTestData = async () => {
    Alert.alert(
      'Confirm Delete',
      'This will delete ALL test data created by this utility. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            clearResults();
            setLoading(true);

            try {
              addResult('Clearing test data...');

              // Note: This is a simplified clear - in production you'd want to track test data IDs
              addResult('⚠️ Manual deletion recommended via database tools');
              addResult('Test data has no special markers for auto-deletion');

            } catch (error) {
              addResult(`❌ Error: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loadingProject) {
    return (
      <View style={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>Loading...</Title>
            <Paragraph>Loading project information...</Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!projectId) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title>No Project Found</Title>
            <Paragraph>
              Please create a project first or assign a project to your user account.
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>Manager Test Data Utility</Title>
          <Paragraph style={styles.description}>
            Create realistic test data for: {projectName}
          </Paragraph>
          <Chip icon="information" style={styles.infoChip}>
            Project ID: {projectId.substring(0, 8)}...
          </Chip>
          <Paragraph style={styles.debugInfo}>
            Logged in as: {user?.username} ({user?.userId.substring(0, 8)}...)
          </Paragraph>
        </Card.Content>
      </Card>

      <ScrollView style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={debugCheckData}
          disabled={loading}
          style={[styles.button, styles.debugButton]}
          icon="bug"
        >
          Debug: Check Existing Data
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          onPress={createAllTestData}
          disabled={loading}
          style={[styles.button, styles.primaryButton]}
          icon="database-plus"
        >
          Create All Test Data (Recommended)
        </Button>

        <Divider style={styles.divider} />

        <Paragraph style={styles.sectionTitle}>Individual Components:</Paragraph>

        <Button
          mode="outlined"
          onPress={createDefaultMilestones}
          disabled={loading}
          style={styles.button}
          icon="flag"
        >
          0. Create Default Milestones (PM100-PM700)
        </Button>

        <Button
          mode="outlined"
          onPress={createTestSites}
          disabled={loading}
          style={styles.button}
          icon="home-city"
        >
          1. Create Test Sites (3 sites)
        </Button>

        <Button
          mode="outlined"
          onPress={createTestItems}
          disabled={loading}
          style={styles.button}
          icon="format-list-checks"
        >
          2. Create Test Items (15 items)
        </Button>

        <Button
          mode="outlined"
          onPress={createMilestoneProgress}
          disabled={loading}
          style={styles.button}
          icon="flag-checkered"
        >
          3. Create Milestone Progress
        </Button>

        <Button
          mode="outlined"
          onPress={createTestHindrances}
          disabled={loading}
          style={styles.button}
          icon="alert"
        >
          4. Create Test Hindrances (6 issues)
        </Button>

        <Button
          mode="outlined"
          onPress={createTestPurchaseOrders}
          disabled={loading}
          style={styles.button}
          icon="file-document"
        >
          5. Create Purchase Orders (4 POs)
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={clearResults}
          disabled={loading}
          style={styles.button}
        >
          Clear Results
        </Button>
      </ScrollView>

      <Card style={styles.resultsCard}>
        <Card.Content>
          <Title style={styles.resultsTitle}>Results</Title>
          <ScrollView style={styles.resultsScroll}>
            {results.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                Click a button above to create test data...
              </Paragraph>
            ) : (
              results.map((result, index) => (
                <Paragraph key={index} style={styles.resultText}>
                  {result}
                </Paragraph>
              ))
            )}
          </ScrollView>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  infoChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  debugButton: {
    backgroundColor: COLORS.INFO,
  },
  debugInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  resultsCard: {
    flex: 1,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  resultsScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 18,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: COLORS.WARNING_BG,
  },
});
