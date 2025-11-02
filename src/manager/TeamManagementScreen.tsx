import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { database } from '../../models/database';
import TeamModel from '../../models/TeamModel';
import TeamMemberModel from '../../models/TeamMemberModel';
import SiteModel from '../../models/SiteModel';
import TeamManagementService from '../../services/team/TeamManagementService';
import { Q } from '@nozbe/watermelondb';

/**
 * TeamManagementScreen
 *
 * Main screen for managing construction teams.
 * Features:
 * - View all teams with status indicators
 * - Create new teams
 * - Edit existing teams
 * - Assign/remove team members
 * - Filter teams by site and status
 */
const TeamManagementScreen = () => {
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamModel | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSite, setFilterSite] = useState<string | null>(null);

  // Form state for new team
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSite, setNewTeamSite] = useState('');
  const [newTeamSpecialization, setNewTeamSpecialization] = useState('');

  useEffect(() => {
    loadTeams();
    loadSites();
  }, [filterStatus, filterSite]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      let loadedTeams: TeamModel[];

      if (filterStatus && filterSite) {
        // Filter by both status and site
        loadedTeams = await database.collections
          .get<TeamModel>('teams')
          .query(
            Q.where('status', filterStatus),
            Q.where('site_id', filterSite)
          )
          .fetch();
      } else if (filterStatus) {
        // Filter by status only
        loadedTeams = await TeamManagementService.getActiveTeams();
        if (filterStatus !== 'active') {
          loadedTeams = await database.collections
            .get<TeamModel>('teams')
            .query(Q.where('status', filterStatus))
            .fetch();
        }
      } else if (filterSite) {
        // Filter by site only
        loadedTeams = await TeamManagementService.getTeamsBySite(filterSite);
      } else {
        // Load all teams
        loadedTeams = await database.collections
          .get<TeamModel>('teams')
          .query()
          .fetch();
      }

      setTeams(loadedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const loadedSites = await database.collections
        .get<SiteModel>('sites')
        .query()
        .fetch();
      setSites(loadedSites);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const members = await TeamManagementService.getTeamMembers(teamId);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamSite) {
      Alert.alert('Validation Error', 'Please fill in team name and select a site');
      return;
    }

    try {
      await TeamManagementService.createTeam({
        name: newTeamName.trim(),
        siteId: newTeamSite,
        status: 'active',
        specialization: newTeamSpecialization.trim() || undefined,
      });

      // Reset form
      setNewTeamName('');
      setNewTeamSite('');
      setNewTeamSpecialization('');
      setAddModalVisible(false);

      // Reload teams
      loadTeams();

      Alert.alert('Success', 'Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to disband this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disband',
          style: 'destructive',
          onPress: async () => {
            try {
              await TeamManagementService.deleteTeam(teamId);
              setSelectedTeam(null);
              loadTeams();
              Alert.alert('Success', 'Team disbanded successfully');
            } catch (error) {
              console.error('Error disbanding team:', error);
              Alert.alert('Error', 'Failed to disband team');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#FFC107';
      case 'disbanded':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderTeamCard = (team: TeamModel) => (
    <TouchableOpacity
      key={team.id}
      style={[
        styles.teamCard,
        selectedTeam?.id === team.id && styles.selectedTeamCard,
      ]}
      onPress={() => setSelectedTeam(team)}
    >
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{team.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(team.status) }]}>
          <Text style={styles.statusText}>{team.status}</Text>
        </View>
      </View>

      {team.specialization && (
        <Text style={styles.teamSpecialization}>{team.specialization}</Text>
      )}

      <View style={styles.teamInfo}>
        <Text style={styles.teamInfoText}>
          Site: {sites.find(s => s.id === team.siteId)?.name || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAddTeamModal = () => (
    <Modal
      visible={addModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setAddModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Team</Text>

          <Text style={styles.inputLabel}>Team Name *</Text>
          <TextInput
            style={styles.input}
            value={newTeamName}
            onChangeText={setNewTeamName}
            placeholder="Enter team name"
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Specialization</Text>
          <TextInput
            style={styles.input}
            value={newTeamSpecialization}
            onChangeText={setNewTeamSpecialization}
            placeholder="e.g., electrical, plumbing, carpentry"
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Site *</Text>
          <ScrollView style={styles.siteSelector}>
            {sites.map((site) => (
              <TouchableOpacity
                key={site.id}
                style={[
                  styles.siteOption,
                  newTeamSite === site.id && styles.selectedSiteOption,
                ]}
                onPress={() => setNewTeamSite(site.id)}
              >
                <Text
                  style={[
                    styles.siteOptionText,
                    newTeamSite === site.id && styles.selectedSiteOptionText,
                  ]}
                >
                  {site.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={handleCreateTeam}
            >
              <Text style={styles.createButtonText}>Create Team</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Team</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, !filterStatus && styles.activeFilterChip]}
            onPress={() => setFilterStatus(null)}
          >
            <Text style={[styles.filterChipText, !filterStatus && styles.activeFilterChipText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'active' && styles.activeFilterChip]}
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'active' && styles.activeFilterChipText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'inactive' && styles.activeFilterChip]}
            onPress={() => setFilterStatus('inactive')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'inactive' && styles.activeFilterChipText]}>
              Inactive
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Teams List */}
        <ScrollView style={styles.teamsList}>
          {loading ? (
            <Text style={styles.loadingText}>Loading teams...</Text>
          ) : teams.length === 0 ? (
            <Text style={styles.emptyText}>No teams found. Create your first team!</Text>
          ) : (
            teams.map(renderTeamCard)
          )}
        </ScrollView>

        {/* Team Details Panel */}
        {selectedTeam && (
          <View style={styles.detailsPanel}>
            <Text style={styles.detailsTitle}>{selectedTeam.name}</Text>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Team Members ({teamMembers.length})</Text>
              {teamMembers.length === 0 ? (
                <Text style={styles.emptyMembers}>No members assigned</Text>
              ) : (
                teamMembers.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <Text style={styles.memberRole}>{member.role}</Text>
                    <Text style={styles.memberUserId}>User: {member.userId}</Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTeam(selectedTeam.id)}
            >
              <Text style={styles.deleteButtonText}>Disband Team</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderAddTeamModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  teamsList: {
    flex: 1,
    padding: 12,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  teamCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTeamCard: {
    borderColor: '#2196F3',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  teamSpecialization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  teamInfo: {
    marginTop: 4,
  },
  teamInfoText: {
    fontSize: 14,
    color: '#666',
  },
  detailsPanel: {
    width: 300,
    backgroundColor: '#fff',
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyMembers: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  memberItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  memberUserId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  siteSelector: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  siteOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedSiteOption: {
    backgroundColor: '#E3F2FD',
  },
  siteOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedSiteOptionText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#2196F3',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeamManagementScreen;
