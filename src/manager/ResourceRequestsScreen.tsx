import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ResourceRequestForm from './components/ResourceRequestForm';
import ApprovalQueue from './components/ApprovalQueue';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { COLORS } from '../theme/colors';

/**
 * ResourceRequestsScreen
 *
 * Screen for managing resource requests.
 * Features:
 * - Tab view with two modes: Create Request and Approval Queue
 * - Create new resource requests
 * - Approve/reject pending requests
 */
const ResourceRequestsScreen = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'approve'>('create');

  // In a real app, get current user ID from auth context
  // For now, use a mock user ID
  const currentUserId = 'manager1';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Resource Requests</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approve' && styles.activeTab]}
          onPress={() => setActiveTab('approve')}
        >
          <Text style={[styles.tabText, activeTab === 'approve' && styles.activeTabText]}>
            Approval Queue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'create' ? (
          <ResourceRequestForm currentUserId={currentUserId} />
        ) : (
          <ApprovalQueue currentUserId={currentUserId} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.INFO,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.INFO,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ResourceRequestsScreenWithBoundary = () => (
  <ErrorBoundary name="ResourceRequestsScreen">
    <ResourceRequestsScreen />
  </ErrorBoundary>
);

export default ResourceRequestsScreenWithBoundary;
