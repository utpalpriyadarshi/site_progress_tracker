import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../models/database';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Define an interface for the project health data
interface ProjectHealth {
  id: string;
  name: string;
  status: 'onTrack' | 'delayed' | 'atRisk';
  progress: number;
  budget: number;
  timeline: number;
}

// Sample Project Overview screen for managers
const ProjectOverviewScreenComponent = () => {
  // Sample project metrics
  const projectMetrics = {
    totalProjects: 12,
    activeProjects: 8,
    overdueProjects: 2,
    onTrackProjects: 6,
    budgetUtilization: 75,
    resourceUtilization: 82,
  };

  const projectHealth: ProjectHealth[] = [
    { id: '1', name: 'Downtown Tower', status: 'onTrack', progress: 85, budget: 80, timeline: 87 },
    { id: '2', name: 'Shopping Mall', status: 'delayed', progress: 45, budget: 52, timeline: 38 },
    { id: '3', name: 'Hospital Expansion', status: 'onTrack', progress: 72, budget: 68, timeline: 75 },
    { id: '4', name: 'School Renovation', status: 'onTrack', progress: 95, budget: 98, timeline: 92 },
  ];

  const renderProjectHealth = (project: ProjectHealth) => (
    <View style={[
      styles.projectCard,
      project.status === 'onTrack' && styles.onTrack,
      project.status === 'delayed' && styles.delayed,
      project.status === 'atRisk' && styles.atRisk,
    ]}>
      <Text style={styles.projectName}>{project.name}</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{project.progress}%</Text>
          <Text style={styles.metricLabel}>Progress</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{project.budget}%</Text>
          <Text style={styles.metricLabel}>Budget</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{project.timeline}%</Text>
          <Text style={styles.metricLabel}>Timeline</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Project Overview Dashboard</Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLarge}>{projectMetrics.totalProjects}</Text>
          <Text style={styles.metricLabel}>Total Projects</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLarge}>{projectMetrics.activeProjects}</Text>
          <Text style={styles.metricLabel}>Active Projects</Text>
        </View>
        
        <View style={[styles.metricCard, styles.warningCard]}>
          <Text style={[styles.metricLarge, styles.warningText]}>{projectMetrics.overdueProjects}</Text>
          <Text style={[styles.metricLabel, styles.warningText]}>Overdue Projects</Text>
        </View>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLarge}>{projectMetrics.budgetUtilization}%</Text>
          <Text style={styles.metricLabel}>Budget Utilization</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLarge}>{projectMetrics.resourceUtilization}%</Text>
          <Text style={styles.metricLabel}>Resource Utilization</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Health</Text>
        {projectHealth.map(renderProjectHealth)}
      </View>
      
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Generate Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const enhance = withObservables([], () => ({}));

const ProjectOverviewScreen = enhance(ProjectOverviewScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  warningCard: {
    backgroundColor: '#FFE6E6',
  },
  metricLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  warningText: {
    color: '#FF3B30',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  projectCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  onTrack: {
    borderLeftColor: '#4CD964',
  },
  delayed: {
    borderLeftColor: '#FF3B30',
  },
  atRisk: {
    borderLeftColor: '#FFCC00',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ProjectOverviewScreenWithBoundary = () => (
  <ErrorBoundary name="ProjectOverviewScreen">
    <ProjectOverviewScreen />
  </ErrorBoundary>
);

export default ProjectOverviewScreenWithBoundary;