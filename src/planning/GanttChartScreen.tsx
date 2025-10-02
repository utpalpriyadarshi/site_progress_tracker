import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../models/database';

// Define an interface for the project task data
interface ProjectTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'not_started';
}

// Sample Gantt Chart screen for construction planning
const GanttChartScreenComponent = () => {
  // Sample project tasks data
  const projectTasks: ProjectTask[] = [
    { id: '1', name: 'Site Preparation', startDate: '2025-01-01', endDate: '2025-01-15', progress: 100, status: 'completed' },
    { id: '2', name: 'Foundation', startDate: '2025-01-10', endDate: '2025-02-10', progress: 100, status: 'completed' },
    { id: '3', name: 'Framing', startDate: '2025-02-05', endDate: '2025-03-15', progress: 75, status: 'in_progress' },
    { id: '4', name: 'Electrical', startDate: '2025-03-01', endDate: '2025-04-10', progress: 30, status: 'in_progress' },
    { id: '5', name: 'Plumbing', startDate: '2025-03-05', endDate: '2025-04-15', progress: 10, status: 'not_started' },
    { id: '6', name: 'Finishing', startDate: '2025-04-01', endDate: '2025-05-30', progress: 0, status: 'not_started' },
  ];

  const renderGanttBar = (task: ProjectTask, index: number) => {
    // Calculate position based on start and end dates (simplified for demo)
    const widthPercentage = task.progress;
    
    return (
      <View key={task.id} style={styles.taskRow}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskDates}>{task.startDate} - {task.endDate}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${widthPercentage}%` },
              task.status === 'completed' && styles.completed,
              task.status === 'in_progress' && styles.inProgress,
              task.status === 'not_started' && styles.notStarted,
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{task.progress}%</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Project Timeline (Gantt Chart)</Text>
      <Text style={styles.subtitle}>Track project schedule and dependencies</Text>
      
      <View style={styles.legend}>
        <View style={[styles.legendItem, styles.completed]} />
        <Text style={styles.legendText}>Completed</Text>
        <View style={[styles.legendItem, styles.inProgress]} />
        <Text style={styles.legendText}>In Progress</Text>
        <View style={[styles.legendItem, styles.notStarted]} />
        <Text style={styles.legendText}>Not Started</Text>
      </View>
      
      <View style={styles.chartHeader}>
        <Text style={styles.chartHeaderText}>Task</Text>
        <Text style={styles.chartHeaderText}>Timeline</Text>
        <Text style={styles.chartHeaderText}>Progress</Text>
      </View>
      
      {projectTasks.map((task, index) => renderGanttBar(task, index))}
    </ScrollView>
  );
};

const enhance = withObservables([], () => ({}));

const GanttChartScreen = enhance(GanttChartScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    marginRight: 16,
    fontSize: 12,
    color: '#666',
  },
  chartHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taskInfo: {
    flex: 1.5,
    paddingRight: 16,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDates: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    flex: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  completed: {
    backgroundColor: '#4CD964',
  },
  inProgress: {
    backgroundColor: '#FFCC00',
  },
  notStarted: {
    backgroundColor: '#C0C0C0',
  },
  progressText: {
    flex: 0.5,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default GanttChartScreen;