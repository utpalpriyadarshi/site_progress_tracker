/**
 * Phase 1 Testing Utility Component
 *
 * This component can be temporarily added to the app to run database tests
 * for verifying migration v30 and milestone functionality.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph, Divider } from 'react-native-paper';
import { database } from '../../models/database';
import { COLORS } from '../theme/colors';

export const Phase1TestUtility = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, message]);
    console.log(message);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 4: Database Schema Verification
  const runTest4 = async () => {
    clearResults();
    setTesting(true);
    addResult('=== Test 4: Database Schema Verification ===\n');

    try {
      // Check if collections exist
      const milestonesCollection = database.collections.get('milestones');
      addResult('✓ Milestones collection exists');

      const milestoneProgressCollection = database.collections.get('milestone_progress');
      addResult('✓ Milestone Progress collection exists');

      const purchaseOrdersCollection = database.collections.get('purchase_orders');
      addResult('✓ Purchase Orders collection exists');

      // Query each collection
      const milestones = await milestonesCollection.query().fetch();
      addResult(`✓ Milestones: ${milestones.length} records`);

      const milestoneProgress = await milestoneProgressCollection.query().fetch();
      addResult(`✓ Milestone Progress: ${milestoneProgress.length} records`);

      const purchaseOrders = await purchaseOrdersCollection.query().fetch();
      addResult(`✓ Purchase Orders: ${purchaseOrders.length} records`);

      addResult('\n✅ Test 4: PASSED - All collections exist and can be queried');
    } catch (error) {
      addResult(`\n❌ Test 4: FAILED - ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // Test 5: Milestone Data Integrity
  const runTest5 = async () => {
    clearResults();
    setTesting(true);
    addResult('=== Test 5: Milestone Data Integrity ===\n');

    try {
      const milestones = await database.collections.get('milestones').query().fetch();

      if (milestones.length === 0) {
        addResult('⚠️ No milestones found. Create a project first to test.');
        setTesting(false);
        return;
      }

      addResult(`Found ${milestones.length} milestone(s)\n`);

      // Group by project
      const projectGroups = milestones.reduce((acc: any, m: any) => {
        if (!acc[m.projectId]) {
          acc[m.projectId] = [];
        }
        acc[m.projectId].push(m);
        return acc;
      }, {});

      for (const projectId in projectGroups) {
        const projectMilestones = projectGroups[projectId];

        // Get project name
        try {
          const project = await database.collections.get('projects').find(projectId);
          addResult(`📁 Project: ${(project as any).name}`);
        } catch {
          addResult(`📁 Project ID: ${projectId}`);
        }

        // Sort by sequence order
        projectMilestones.sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder);

        let totalWeightage = 0;
        projectMilestones.forEach((m: any) => {
          addResult(
            `  ${m.milestoneCode}: ${m.milestoneName} - ${m.weightage}% (order: ${m.sequenceOrder}, custom: ${m.isCustom})`
          );
          totalWeightage += m.weightage;
        });

        addResult(`  Total weightage: ${totalWeightage}%`);

        if (totalWeightage === 100) {
          addResult('  ✓ Weightage validation: PASS (100%)');
        } else {
          addResult(`  ⚠️ Weightage validation: WARNING (${totalWeightage}%)`);
        }

        addResult('');
      }

      addResult('✅ Test 5: PASSED - Milestone data structure validated');
    } catch (error) {
      addResult(`\n❌ Test 5: FAILED - ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // Test 6: Models Association Check
  const runTest6 = async () => {
    clearResults();
    setTesting(true);
    addResult('=== Test 6: Models Association Check ===\n');

    try {
      const milestones = await database.collections.get('milestones').query().fetch();

      if (milestones.length === 0) {
        addResult('⚠️ No milestones found. Create a project first to test.');
        setTesting(false);
        return;
      }

      // Test milestone -> project association
      const firstMilestone: any = milestones[0];
      addResult(`Testing milestone: ${firstMilestone.milestoneCode} - ${firstMilestone.milestoneName}`);
      addResult(`Project ID: ${firstMilestone.projectId}`);

      const project = await database.collections.get('projects').find(firstMilestone.projectId);
      addResult(`✓ Successfully fetched project: ${(project as any).name}`);

      // Test project -> milestones association
      const projectMilestones = await database.collections
        .get('milestones')
        .query()
        .fetch();
      const relatedMilestones = projectMilestones.filter(
        (m: any) => m.projectId === firstMilestone.projectId
      );
      addResult(`✓ Found ${relatedMilestones.length} milestone(s) for this project`);

      addResult('\n✅ Test 6: PASSED - Model associations working correctly');
    } catch (error) {
      addResult(`\n❌ Test 6: FAILED - ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    clearResults();
    setTesting(true);

    addResult('=== Running All Phase 1 Tests ===\n');

    await runTest4();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

    await runTest5();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

    await runTest6();

    addResult('\n=== All Tests Completed ===');
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Phase 1 Testing Utility</Title>
          <Paragraph style={styles.description}>
            Run database tests to verify migration v30 and milestone functionality.
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={runTest4}
          disabled={testing}
          style={styles.button}
        >
          Test 4: Schema Verification
        </Button>
        <Button
          mode="contained"
          onPress={runTest5}
          disabled={testing}
          style={styles.button}
        >
          Test 5: Milestone Data Integrity
        </Button>
        <Button
          mode="contained"
          onPress={runTest6}
          disabled={testing}
          style={styles.button}
        >
          Test 6: Model Associations
        </Button>
        <Divider style={styles.divider} />
        <Button
          mode="contained"
          onPress={runAllTests}
          disabled={testing}
          style={styles.button}
          buttonColor={COLORS.SUCCESS}
        >
          Run All Tests
        </Button>
        <Button
          mode="outlined"
          onPress={clearResults}
          disabled={testing}
          style={styles.button}
        >
          Clear Results
        </Button>
      </View>

      <Card style={styles.resultsCard}>
        <Card.Content>
          <Title style={styles.resultsTitle}>Test Results</Title>
          <ScrollView style={styles.resultsScroll}>
            {testResults.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                Click a test button to see results here...
              </Paragraph>
            ) : (
              testResults.map((result, index) => (
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
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
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
    maxHeight: 400,
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
});
