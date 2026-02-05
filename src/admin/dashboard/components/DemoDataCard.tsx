/**
 * DemoDataCard Component
 *
 * Admin dashboard card for generating realistic demo data
 * to populate a project for tutorial and testing purposes.
 *
 * @version 1.0.0
 * @since v2.13 - App Tutorial & Demo Data
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Menu } from 'react-native-paper';
import { database } from '../../../../models/database';
import { generatePlannerDemoData, DemoDataResult } from '../../../services/DemoDataService';

interface ProjectOption {
  id: string;
  name: string;
}

export const DemoDataCard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [lastResult, setLastResult] = useState<DemoDataResult | null>(null);

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

  const handleGenerate = async () => {
    if (!selectedProject) {
      Alert.alert('Select Project', 'Please select a project first.');
      return;
    }

    Alert.alert(
      'Generate Demo Data',
      `This will create Key Dates, Sites, Milestones, and WBS Items in "${selectedProject.name}".\n\nExisting data will NOT be deleted. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGenerating(true);
            try {
              const result = await generatePlannerDemoData(selectedProject.id);
              setLastResult(result);
              Alert.alert(
                'Demo Data Created',
                `Successfully created:\n• ${result.keyDatesCreated} Key Dates\n• ${result.sitesCreated} Sites\n• ${result.categoriesCreated} Categories\n• ${result.milestonesCreated} Milestones\n• ${result.milestoneProgressCreated} Milestone Progress\n• ${result.itemsCreated} WBS Items\n\nSwitch to Planner role to view the data.`
              );
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

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Demo Data Generator</Title>
        <Paragraph style={styles.description}>
          Populate a project with realistic demo data for Planner role — Key Dates,
          Sites, Milestones, and WBS Items with dependencies.
        </Paragraph>

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
          {isGenerating ? 'Generating...' : 'Generate Planner Demo Data'}
        </Button>

        {/* Last Result */}
        {lastResult && (
          <Text style={styles.resultText}>
            Last: {lastResult.keyDatesCreated} KDs, {lastResult.sitesCreated} Sites,{' '}
            {lastResult.milestonesCreated} Milestones, {lastResult.itemsCreated} Items
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
