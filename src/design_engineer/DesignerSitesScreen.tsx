/**
 * DesignerSitesScreen
 *
 * Dedicated screen for designers to view and select their assigned sites.
 * Follows the supervisor Sites screen pattern.
 *
 * Features:
 * - Shows all sites assigned to the current designer
 * - Site selector for filtering design work
 * - Site cards showing site details
 * - Empty state when no sites assigned
 *
 * @version 1.0.0
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import SiteModel from '../../models/SiteModel';
import SiteSelector from './components/SiteSelector';
import { EmptyState } from '../components/common/EmptyState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../auth/AuthContext';
import { CommonActions } from '@react-navigation/native';

interface DesignerSitesScreenProps {
  sites: SiteModel[];
}

const DesignerSitesScreenComponent: React.FC<DesignerSitesScreenProps> = ({ sites }) => {
  const { projectName, engineerId } = useDesignEngineerContext();
  const { logout } = useAuth();
  const navigation = useAuth().navigation;

  const handleLogout = async () => {
    await logout();
    if (navigation) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' as any }],
        })
      );
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.projectName}>{projectName}</Text>
              <Text style={styles.roleLabel}>My Sites</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Site Selector */}
        <SiteSelector style={styles.siteSelector} />

        {/* Sites List */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {sites.length === 0 ? (
            <EmptyState
              icon="map-marker-off"
              title="No Sites Assigned"
              message="You don't have any sites assigned yet. Contact your planner to get assigned to sites."
              variant="large"
            />
          ) : (
            sites.map((site) => (
              <Card key={site.id} style={styles.siteCard}>
                <Card.Content>
                  <View style={styles.siteHeader}>
                    <Text style={styles.siteName}>{site.name}</Text>
                  </View>
                  <View style={styles.siteDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Location:</Text>
                      <Text style={styles.value}>{site.location}</Text>
                    </View>
                    {site.plannedStartDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Planned Start:</Text>
                        <Text style={styles.value}>
                          {new Date(site.plannedStartDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {site.plannedEndDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Planned End:</Text>
                        <Text style={styles.value}>
                          {new Date(site.plannedEndDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables(['engineerId'], ({ engineerId }: { engineerId: string }) => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('design_engineer_id', engineerId)),
}));

const EnhancedDesignerSitesScreen = enhance(DesignerSitesScreenComponent as any);

// Wrapper component that provides context
const DesignerSitesScreen = () => {
  const { engineerId } = useDesignEngineerContext();
  return <EnhancedDesignerSitesScreen engineerId={engineerId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#673AB7',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  siteSelector: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  siteCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  siteDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 110,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default DesignerSitesScreen;
