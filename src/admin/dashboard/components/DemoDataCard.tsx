/**
 * DemoDataCard Component
 *
 * Admin dashboard card for generating realistic demo data
 * to populate a project for tutorial and testing purposes.
 *
 * Supports:
 * - Planner: Key Dates, Sites, Milestones, WBS Items
 * - Design Engineer: DOORS Packages, Design RFQs, Design Documents
 * - Supervisor: Sites, Items, Progress Logs, Hindrances, Materials, Inspections
 *
 * @version 3.0.0
 * @since v2.13 - App Tutorial & Demo Data
 * @updated v2.14 - Design Engineer Demo Data
 * @updated v2.15 - Supervisor Demo Data
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Menu } from 'react-native-paper';
import { database } from '../../../../models/database';
import {
  generatePlannerDemoData,
  generateDesignerDemoData,
  generateSupervisorDemoData,
  DemoDataResult,
  DesignerDemoDataResult,
  SupervisorDemoDataResult,
} from '../../../services/DemoDataService';

interface ProjectOption {
  id: string;
  name: string;
}

interface SupervisorOption {
  id: string;
  name: string;
}

type RoleOption = 'planner' | 'design_engineer' | 'supervisor';

const ROLE_OPTIONS: { value: RoleOption; label: string }[] = [
  { value: 'planner', label: 'Planner' },
  { value: 'design_engineer', label: 'Design Engineer' },
  { value: 'supervisor', label: 'Supervisor' },
];

export const DemoDataCard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption>('planner');
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  // Supervisor selection for Supervisor demo data
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorOption | null>(null);
  const [supervisorMenuVisible, setSupervisorMenuVisible] = useState(false);

  useEffect(() => {
    loadProjects();
    loadSupervisors();
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

  const loadSupervisors = async () => {
    try {
      // Find the supervisor role first (case-insensitive comparison)
      const roles = await database.collections.get('roles').query().fetch();
      const supervisorRole = roles.find(
        (r: any) => r.name?.toLowerCase() === 'supervisor'
      );
      if (!supervisorRole) {
        console.warn('Supervisor role not found in roles:', roles.map((r: any) => r.name));
        return;
      }
      // Find all users with supervisor role
      const allUsers = await database.collections.get('users').query().fetch();
      const supervisorUsers = allUsers.filter((u: any) => u.roleId === supervisorRole.id);
      const options: SupervisorOption[] = supervisorUsers.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username || u.id,
      }));
      setSupervisors(options);
      if (options.length === 1) {
        setSelectedSupervisor(options[0]);
      }
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    }
  };

  const getConfirmationMessage = (): string => {
    switch (selectedRole) {
      case 'planner':
        return `This will create Key Dates, Sites, Milestones, and WBS Items in "${selectedProject?.name}".\n\nExisting data will NOT be deleted. Continue?`;
      case 'design_engineer':
        return `This will create DOORS Packages, Design RFQs, and Design Documents in "${selectedProject?.name}".\n\nExisting data will NOT be deleted. Continue?`;
      case 'supervisor':
        return `This will create Sites (assigned to ${selectedSupervisor?.name || 'selected supervisor'}), Items, Progress Logs, Hindrances, Materials, and Inspections in "${selectedProject?.name}".\n\nExisting data will NOT be deleted. Continue?`;
      default:
        return '';
    }
  };

  const formatPlannerResult = (result: DemoDataResult): string => {
    return `Successfully created:\n• ${result.keyDatesCreated} Key Dates\n• ${result.sitesCreated} Sites\n• ${result.categoriesCreated} Categories\n• ${result.milestonesCreated} Milestones\n• ${result.milestoneProgressCreated} Milestone Progress\n• ${result.itemsCreated} WBS Items\n\nSwitch to Planner role to view the data.`;
  };

  const formatDesignerResult = (result: DesignerDemoDataResult): string => {
    return `Successfully created:\n• ${result.doorsPackagesCreated} DOORS Packages\n• ${result.designRfqsCreated} Design RFQs\n• ${result.designDocCategoriesCreated} Document Categories\n• ${result.designDocumentsCreated} Design Documents\n\nSwitch to Design Engineer role to view the data.`;
  };

  const formatSupervisorResult = (result: SupervisorDemoDataResult): string => {
    return `Successfully created:\n• ${result.sitesCreated} Sites\n• ${result.itemsCreated} Items\n• ${result.progressLogsCreated} Progress Logs\n• ${result.dailyReportsCreated} Daily Reports\n• ${result.hindrancesCreated} Hindrances\n• ${result.materialsCreated} Materials\n• ${result.inspectionsCreated} Inspections\n\nSwitch to Supervisor role to view the data.`;
  };

  const handleGenerate = async () => {
    if (!selectedProject) {
      Alert.alert('Select Project', 'Please select a project first.');
      return;
    }

    // For supervisor role, require a supervisor to be selected
    if (selectedRole === 'supervisor' && !selectedSupervisor) {
      Alert.alert('Select Supervisor', 'Please select a supervisor user to assign the demo sites to.');
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
              switch (selectedRole) {
                case 'planner': {
                  const result = await generatePlannerDemoData(selectedProject.id);
                  setLastResult(`Planner: ${result.keyDatesCreated} KDs, ${result.sitesCreated} Sites, ${result.itemsCreated} Items`);
                  Alert.alert('Demo Data Created', formatPlannerResult(result));
                  break;
                }
                case 'design_engineer': {
                  const result = await generateDesignerDemoData(selectedProject.id);
                  setLastResult(`Designer: ${result.doorsPackagesCreated} DOORS, ${result.designRfqsCreated} RFQs, ${result.designDocumentsCreated} Docs`);
                  Alert.alert('Demo Data Created', formatDesignerResult(result));
                  break;
                }
                case 'supervisor': {
                  const result = await generateSupervisorDemoData(selectedProject.id, selectedSupervisor!.id);
                  setLastResult(`Supervisor: ${result.sitesCreated} Sites, ${result.itemsCreated} Items, ${result.hindrancesCreated} Issues`);
                  Alert.alert('Demo Data Created', formatSupervisorResult(result));
                  break;
                }
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
    switch (selectedRole) {
      case 'planner':
        return 'Populate a project with realistic Planner demo data — Key Dates, Sites, Milestones, and WBS Items with dependencies.';
      case 'design_engineer':
        return 'Populate a project with realistic Design Engineer demo data — DOORS Packages, Design RFQs, and Design Documents.';
      case 'supervisor':
        return 'Populate a project with realistic Supervisor demo data — Sites, Items, Progress Logs, Hindrances, Materials, and Inspections.';
      default:
        return '';
    }
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

        {/* Supervisor Selector (only for Supervisor role) */}
        {selectedRole === 'supervisor' && (
          <Menu
            visible={supervisorMenuVisible}
            onDismiss={() => setSupervisorMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="account-hard-hat"
                onPress={() => setSupervisorMenuVisible(true)}
                style={styles.selectorButton}
              >
                {selectedSupervisor ? selectedSupervisor.name : 'Select Supervisor User'}
              </Button>
            }
          >
            {supervisors.map((supervisor) => (
              <Menu.Item
                key={supervisor.id}
                title={supervisor.name}
                leadingIcon={selectedSupervisor?.id === supervisor.id ? 'check' : undefined}
                onPress={() => {
                  setSelectedSupervisor(supervisor);
                  setSupervisorMenuVisible(false);
                }}
              />
            ))}
            {supervisors.length === 0 && (
              <Menu.Item title="No supervisor users found" disabled />
            )}
          </Menu>
        )}

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
