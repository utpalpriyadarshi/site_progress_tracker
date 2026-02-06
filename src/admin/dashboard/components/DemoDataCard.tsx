/**
 * DemoDataCard Component
 *
 * Admin dashboard card for generating realistic demo data
 * to populate a project for tutorial and testing purposes.
 *
 * Supports:
 * - Planner: Key Dates, Sites, Milestones, WBS Items
 * - Design Engineer: DOORS Packages, Design RFQs, Design Documents
 *
 * @version 2.0.0
 * @since v2.13 - App Tutorial & Demo Data
 * @updated v2.14 - Design Engineer Demo Data
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Menu } from 'react-native-paper';
import { database } from '../../../../models/database';
import {
  generatePlannerDemoData,
  generateDesignerDemoData,
  DemoDataResult,
  DesignerDemoDataResult,
} from '../../../services/DemoDataService';

interface ProjectOption {
  id: string;
  name: string;
}

type RoleOption = 'planner' | 'design_engineer';

const ROLE_OPTIONS: { value: RoleOption; label: string }[] = [
  { value: 'planner', label: 'Planner' },
  { value: 'design_engineer', label: 'Design Engineer' },
];

export const DemoDataCard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption>('planner');
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await database.collections.get('projects').query().fetch();
      const options: ProjectOption[] = allProjects.map((p: any) => ({
        id: p.id,
        name: p.name || p.id,
      }));
      setProjects(options);
      if (options.length === 1) {
        setSelectedProject(options[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const getConfirmationMessage = (): string => {
    if (selectedRole === 'planner') {
      return `This will create Key Dates, Sites, Milestones, and WBS Items in "${selectedProject?.name}".\n\nExisting data will NOT be deleted. Continue?`;
    }
    return `This will create DOORS Packages, Design RFQs, and Design Documents in "${selectedProject?.name}".\n\nExisting data will NOT be deleted. Continue?`;
  };

  const formatPlannerResult = (result: DemoDataResult): string => {
    return `Successfully created:\n• ${result.keyDatesCreated} Key Dates\n• ${result.sitesCreated} Sites\n• ${result.categoriesCreated} Categories\n• ${result.milestonesCreated} Milestones\n• ${result.milestoneProgressCreated} Milestone Progress\n• ${result.itemsCreated} WBS Items\n\nSwitch to Planner role to view the data.`;
  };

  const formatDesignerResult = (result: DesignerDemoDataResult): string => {
    return `Successfully created:\n• ${result.doorsPackagesCreated} DOORS Packages\n• ${result.designRfqsCreated} Design RFQs\n• ${result.designDocCategoriesCreated} Document Categories\n• ${result.designDocumentsCreated} Design Documents\n\nSwitch to Design Engineer role to view the data.`;
  };

  const handleGenerate = async () => {
    if (!selectedProject) {
      Alert.alert('Select Project', 'Please select a project first.');
      return;
    }

    Alert.alert(
      'Generate Demo Data',
      getConfirmationMessage(),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGenerating(true);
            try {
              if (selectedRole === 'planner') {
                const result = await generatePlannerDemoData(selectedProject.id);
                setLastResult(`Planner: ${result.keyDatesCreated} KDs, ${result.sitesCreated} Sites, ${result.itemsCreated} Items`);
                Alert.alert('Demo Data Created', formatPlannerResult(result));
              } else {
                const result = await generateDesignerDemoData(selectedProject.id);
                setLastResult(`Designer: ${result.doorsPackagesCreated} DOORS, ${result.designRfqsCreated} RFQs, ${result.designDocumentsCreated} Docs`);
                Alert.alert('Demo Data Created', formatDesignerResult(result));
              }
            } catch (error) {
              Alert.alert('Generation Failed', String(error));
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (): string => {
    const option = ROLE_OPTIONS.find(r => r.value === selectedRole);
    return option ? option.label : 'Select Role';
  };

  const getDescription = (): string => {
    if (selectedRole === 'planner') {
      return 'Populate a project with realistic Planner demo data — Key Dates, Sites, Milestones, and WBS Items with dependencies.';
    }
    return 'Populate a project with realistic Design Engineer demo data — DOORS Packages, Design RFQs, and Design Documents.';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Demo Data Generator</Title>
        <Paragraph style={styles.description}>
          {getDescription()}
        </Paragraph>

        {/* Role Selector */}
        <Menu
          visible={roleMenuVisible}
          onDismiss={() => setRoleMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              icon="account-hard-hat"
              onPress={() => setRoleMenuVisible(true)}
              style={styles.selectorButton}
            >
              {getRoleLabel()}
            </Button>
          }
        >
          {ROLE_OPTIONS.map((role) => (
            <Menu.Item
              key={role.value}
              title={role.label}
              leadingIcon={selectedRole === role.value ? 'check' : undefined}
              onPress={() => {
                setSelectedRole(role.value);
                setRoleMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        {/* Project Selector */}
        <Menu
          visible={projectMenuVisible}
          onDismiss={() => setProjectMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              icon="folder-open"
              onPress={() => setProjectMenuVisible(true)}
              style={styles.selectorButton}
            >
              {selectedProject ? selectedProject.name : 'Select Project'}
            </Button>
          }
        >
          {projects.map((project) => (
            <Menu.Item
              key={project.id}
              title={project.name}
              onPress={() => {
                setSelectedProject(project);
                setProjectMenuVisible(false);
              }}
            />
          ))}
          {projects.length === 0 && (
            <Menu.Item title="No projects found" disabled />
          )}
        </Menu>

        {/* Generate Button */}
        <Button
          mode="contained"
          icon="database-plus"
          onPress={handleGenerate}
          disabled={isGenerating || !selectedProject}
          loading={isGenerating}
          style={styles.generateButton}
        >
          {isGenerating ? 'Generating...' : `Generate ${getRoleLabel()} Demo Data`}
        </Button>

        {/* Last Result */}
        {lastResult && (
          <Text style={styles.resultText}>
            Last: {lastResult}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginBottom: 10,
    backgroundColor: '#E8F5E9',
  },
  description: {
    marginTop: 5,
    marginBottom: 15,
    color: '#666',
  },
  selectorButton: {
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#388E3C',
  },
  resultText: {
    fontSize: 12,
    color: '#388E3C',
    marginTop: 10,
  },
});
