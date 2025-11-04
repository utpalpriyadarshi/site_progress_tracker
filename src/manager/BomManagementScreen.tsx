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
  ActivityIndicator,
} from 'react-native';
import { useBomContext } from './context/BomContext';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import BomCostDashboard from './components/BomCostDashboard';
import BomItemEditor from './components/BomItemEditor';
import BomCostBreakdown from './components/BomCostBreakdown';
import BomImport from './components/BomImport';

/**
 * BomManagementScreen
 *
 * Main screen for managing Bills of Materials (BOMs).
 * Features:
 * - View all BOMs with filtering (Pre-Contract/Post-Contract)
 * - Create new BOMs (Estimating or Execution)
 * - Edit existing BOMs
 * - View and manage BOM items
 * - Cost tracking and analytics
 */
const BomManagementScreen = () => {
  const {
    selectedBom,
    setSelectedBom,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    createBom,
    updateBom,
    deleteBom,
    getAllBoms,
    getBomItems,
    addBomItem,
    updateBomItem,
    deleteBomItem,
    calculateCostBreakdown,
    refreshTrigger,
    loading,
    setLoading,
  } = useBomContext();

  // State
  const [boms, setBoms] = useState<BomModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [bomItems, setBomItems] = useState<BomItemModel[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'estimating' | 'execution'>('estimating');

  // Form state for new/edit BOM
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    type: 'estimating' as 'estimating' | 'execution',
    status: 'draft',
    quantity: 1,
    unit: '',
    client: '',
    tenderDate: Date.now(),
    contractValue: 0,
    contingency: 5,
    profitMargin: 10,
    description: '',
  });

  // Form state for BOM items
  const [itemFormData, setItemFormData] = useState({
    itemCode: '',
    description: '',
    category: 'material' as 'material' | 'labor' | 'equipment' | 'subcontractor',
    subCategory: '',
    quantity: 0,
    unit: '',
    unitCost: 0,
    wbsCode: '',
    phase: '',
    notes: '',
  });

  // Cost breakdown state
  const [costBreakdown, setCostBreakdown] = useState({
    totalEstimated: 0,
    totalActual: 0,
    materialCost: 0,
    laborCost: 0,
    equipmentCost: 0,
    subcontractorCost: 0,
    contingencyAmount: 0,
    profitAmount: 0,
    grandTotal: 0,
  });

  // Load data
  useEffect(() => {
    loadBoms();
    loadProjects();
  }, [refreshTrigger, filterType, filterStatus, activeTab]);

  useEffect(() => {
    if (selectedBom) {
      loadBomItems();
      loadCostBreakdown();
    }
  }, [selectedBom, refreshTrigger]);

  const loadBoms = async () => {
    try {
      setLoading(true);
      const allBoms = await getAllBoms();

      // Filter by active tab and additional filters
      let filtered = allBoms.filter((bom) => bom.type === activeTab);

      if (filterStatus) {
        filtered = filtered.filter((bom) => bom.status === filterStatus);
      }

      // Sort by created date (newest first)
      filtered.sort((a, b) => b.createdDate - a.createdDate);

      setBoms(filtered);
    } catch (error) {
      console.error('Error loading BOMs:', error);
      Alert.alert('Error', 'Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const allProjects = await database.collections.get<ProjectModel>('projects').query().fetch();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadBomItems = async () => {
    if (!selectedBom) return;

    try {
      const items = await getBomItems(selectedBom.id);
      setBomItems(items);
    } catch (error) {
      console.error('Error loading BOM items:', error);
    }
  };

  const loadCostBreakdown = async () => {
    if (!selectedBom) return;

    try {
      const breakdown = await calculateCostBreakdown(selectedBom.id);
      setCostBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating cost breakdown:', error);
    }
  };

  const handleCreateBom = async () => {
    if (!formData.name.trim() || !formData.projectId) {
      Alert.alert('Validation Error', 'Please fill in BOM name and select a project');
      return;
    }
    if (!formData.unit.trim()) {
      Alert.alert('Validation Error', 'Please enter a unit (e.g., nos, apartments, floors)');
      return;
    }

    try {
      await createBom({
        name: formData.name.trim(),
        projectId: formData.projectId,
        type: formData.type,
        status: formData.status as any,
        quantity: formData.quantity,
        unit: formData.unit.trim(),
        client: formData.client,
        tenderDate: formData.tenderDate,
        contractValue: formData.contractValue,
        contingency: formData.contingency,
        profitMargin: formData.profitMargin,
        description: formData.description,
        createdBy: 'current-user-id', // TODO: Get from auth context
      });

      resetForm();
      setAddModalVisible(false);
      Alert.alert('Success', 'BOM created successfully');
    } catch (error) {
      console.error('Error creating BOM:', error);
      Alert.alert('Error', 'Failed to create BOM');
    }
  };

  const handleUpdateBom = async () => {
    if (!selectedBom) return;

    try {
      await updateBom(selectedBom.id, {
        name: formData.name.trim(),
        status: formData.status,
        client: formData.client,
        tenderDate: formData.tenderDate,
        contractValue: formData.contractValue,
        contingency: formData.contingency,
        profitMargin: formData.profitMargin,
        description: formData.description,
      });

      resetForm();
      setEditModalVisible(false);
      Alert.alert('Success', 'BOM updated successfully');
    } catch (error) {
      console.error('Error updating BOM:', error);
      Alert.alert('Error', 'Failed to update BOM');
    }
  };

  const handleDeleteBom = async (bomId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this BOM? All items will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBom(bomId);
            Alert.alert('Success', 'BOM deleted successfully');
          } catch (error) {
            console.error('Error deleting BOM:', error);
            Alert.alert('Error', 'Failed to delete BOM');
          }
        },
      },
    ]);
  };

  const handleAddItem = async () => {
    if (!selectedBom) return;
    if (!itemFormData.itemCode.trim() || !itemFormData.description.trim()) {
      Alert.alert('Validation Error', 'Please fill in item code and description');
      return;
    }

    try {
      await addBomItem(selectedBom.id, itemFormData);
      resetItemForm();
      setAddItemModalVisible(false);
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBomItem(itemId);
            Alert.alert('Success', 'Item deleted successfully');
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      projectId: '',
      type: 'estimating',
      status: 'draft',
      quantity: 1,
      unit: '',
      client: '',
      tenderDate: Date.now(),
      contractValue: 0,
      contingency: 5,
      profitMargin: 10,
      description: '',
    });
  };

  const resetItemForm = () => {
    setItemFormData({
      itemCode: '',
      description: '',
      category: 'material',
      subCategory: '',
      quantity: 0,
      unit: '',
      unitCost: 0,
      wbsCode: '',
      phase: '',
      notes: '',
    });
  };

  const openEditModal = (bom: BomModel) => {
    setFormData({
      name: bom.name,
      projectId: bom.projectId,
      type: bom.type as 'estimating' | 'execution',
      status: bom.status,
      quantity: bom.quantity || 1,
      unit: bom.unit || '',
      client: bom.client || '',
      tenderDate: bom.tenderDate || Date.now(),
      contractValue: bom.contractValue || 0,
      contingency: bom.contingency,
      profitMargin: bom.profitMargin,
      description: bom.description || '',
    });
    setEditModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#9E9E9E',
      submitted: '#2196F3',
      won: '#4CAF50',
      lost: '#F44336',
      baseline: '#FF9800',
      active: '#4CAF50',
      closed: '#757575',
    };
    return colors[status] || '#9E9E9E';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const renderBomCard = (bom: BomModel) => {
    const project = projects.find((p) => p.id === bom.projectId);

    return (
      <TouchableOpacity
        key={bom.id}
        style={[styles.bomCard, selectedBom?.id === bom.id && styles.selectedBomCard]}
        onPress={() => setSelectedBom(bom)}
      >
        <View style={styles.bomHeader}>
          <Text style={styles.bomName}>{bom.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bom.status) }]}>
            <Text style={styles.statusText}>{bom.status}</Text>
          </View>
        </View>

        {project && <Text style={styles.projectName}>Project: {project.name}</Text>}

        <View style={styles.bomInfo}>
          <Text style={styles.bomInfoLabel}>Version:</Text>
          <Text style={styles.bomInfoValue}>{bom.version}</Text>
        </View>

        <View style={styles.bomInfo}>
          <Text style={styles.bomInfoLabel}>Estimated Cost:</Text>
          <Text style={styles.bomInfoValue}>{formatCurrency(bom.totalEstimatedCost)}</Text>
        </View>

        {bom.type === 'execution' && (
          <View style={styles.bomInfo}>
            <Text style={styles.bomInfoLabel}>Actual Cost:</Text>
            <Text style={styles.bomInfoValue}>{formatCurrency(bom.totalActualCost)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBomDetails = () => {
    if (!selectedBom) return null;

    const project = projects.find((p) => p.id === selectedBom.projectId);

    return (
      <View style={styles.detailsPanel}>
        <ScrollView style={styles.detailsScrollView} contentContainerStyle={styles.detailsScrollContent}>
          <Text style={styles.detailsTitle}>{selectedBom.name}</Text>

          {/* Cost Dashboard */}
          <View style={styles.detailsSection}>
            <BomCostDashboard bom={selectedBom} items={bomItems} />
          </View>

          {/* Cost Breakdown Visualization */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Cost Breakdown</Text>
            <BomCostBreakdown
              materialCost={costBreakdown.materialCost}
              laborCost={costBreakdown.laborCost}
              equipmentCost={costBreakdown.equipmentCost}
              subcontractorCost={costBreakdown.subcontractorCost}
            />
          </View>

          {/* BOM Items */}
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.detailsSectionTitle}>BOM Items ({bomItems.length})</Text>
              <View style={styles.itemActionsContainer}>
                <TouchableOpacity style={styles.addItemButton} onPress={() => setAddItemModalVisible(true)}>
                  <Text style={styles.addItemButtonText}>+ Add Item</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.importButton} onPress={() => setImportModalVisible(true)}>
                  <Text style={styles.importButtonText}>Import</Text>
                </TouchableOpacity>
              </View>
            </View>

            {bomItems.length === 0 ? (
              <Text style={styles.emptyItems}>No items added yet</Text>
            ) : (
              bomItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemCode}>{item.itemCode}</Text>
                    <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                      <Text style={styles.deleteItemText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>
                      {item.quantity} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
                    </Text>
                  </View>
                  <Text style={styles.itemCategory}>Category: {item.category}</Text>
                </View>
              ))
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(selectedBom)}>
              <Text style={styles.editButtonText}>Edit BOM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteBom(selectedBom.id)}>
              <Text style={styles.deleteButtonText}>Delete BOM</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BOM Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add BOM</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'estimating' && styles.activeTab]}
          onPress={() => {
            setActiveTab('estimating');
            setSelectedBom(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'estimating' && styles.activeTabText]}>
            Pre-Contract (Estimating)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'execution' && styles.activeTab]}
          onPress={() => {
            setActiveTab('execution');
            setSelectedBom(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'execution' && styles.activeTabText]}>
            Post-Contract (Execution)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* BOMs List */}
        <ScrollView style={styles.bomsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading BOMs...</Text>
            </View>
          ) : boms.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No BOMs found</Text>
              <Text style={styles.emptyStateText}>Create your first BOM to get started!</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={() => setAddModalVisible(true)}>
                <Text style={styles.emptyStateButtonText}>+ Add BOM</Text>
              </TouchableOpacity>
            </View>
          ) : (
            boms.map(renderBomCard)
          )}
        </ScrollView>

        {/* BOM Details Panel */}
        {renderBomDetails()}
      </View>

      {/* Add BOM Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create New BOM</Text>

              {/* BOM Name */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  BOM Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Main Tower BOM v1.0"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Project Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Project <Text style={styles.required}>*</Text>
                </Text>
                <ScrollView style={styles.projectSelector}>
                  {projects.length === 0 ? (
                    <Text style={styles.noProjectsText}>No projects available. Please create a project first.</Text>
                  ) : (
                    projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectOption,
                          formData.projectId === project.id && styles.selectedProjectOption,
                        ]}
                        onPress={() => setFormData({ ...formData, projectId: project.id })}
                      >
                        <Text
                          style={[
                            styles.projectOptionText,
                            formData.projectId === project.id && styles.selectedProjectOptionText,
                          ]}
                        >
                          {project.name}
                        </Text>
                        <Text style={styles.projectClientText}>{project.client}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* BOM Type */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  BOM Type <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[styles.typeButton, formData.type === 'estimating' && styles.typeButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'estimating' })}
                  >
                    <Text style={[styles.typeText, formData.type === 'estimating' && styles.typeTextActive]}>
                      Pre-Contract (Estimating)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, formData.type === 'execution' && styles.typeButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'execution' })}
                  >
                    <Text style={[styles.typeText, formData.type === 'execution' && styles.typeTextActive]}>
                      Post-Contract (Execution)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantity and Unit */}
              <View style={styles.rowGroup}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.inputLabel}>
                    Quantity <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity.toString()}
                    onChangeText={(text) => setFormData({ ...formData, quantity: parseFloat(text) || 1 })}
                    placeholder="1"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.inputLabel}>
                    Unit <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                    placeholder="e.g., nos, apartments, floors"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Client (for estimating BOMs) */}
              {formData.type === 'estimating' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Client</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.client}
                    onChangeText={(text) => setFormData({ ...formData, client: text })}
                    placeholder="Client name"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* Contract Value (for execution BOMs) */}
              {formData.type === 'execution' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Contract Value (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.contractValue.toString()}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contractValue: parseFloat(text) || 0 })
                    }
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="BOM description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setAddModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreateBom}>
                  <Text style={styles.createButtonText}>Create BOM</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit BOM Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEditModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit BOM</Text>

              {/* BOM Name */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  BOM Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Main Tower BOM v1.0"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Client (for estimating BOMs) */}
              {formData.type === 'estimating' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Client</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.client}
                    onChangeText={(text) => setFormData({ ...formData, client: text })}
                    placeholder="Client name"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* Contract Value (for execution BOMs) */}
              {formData.type === 'execution' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Contract Value (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.contractValue.toString()}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contractValue: parseFloat(text) || 0 })
                    }
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Contingency */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Contingency (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contingency.toString()}
                  onChangeText={(text) => setFormData({ ...formData, contingency: parseFloat(text) || 0 })}
                  placeholder="5"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              {/* Profit Margin */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Profit Margin (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.profitMargin.toString()}
                  onChangeText={(text) => setFormData({ ...formData, profitMargin: parseFloat(text) || 0 })}
                  placeholder="10"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="BOM description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleUpdateBom}>
                  <Text style={styles.createButtonText}>Update BOM</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add BOM Item Modal */}
      <Modal
        visible={addItemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddItemModalVisible(false);
          resetItemForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <BomItemEditor
              mode="add"
              onSave={handleAddItem}
              onCancel={() => {
                setAddItemModalVisible(false);
                resetItemForm();
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Import BOM Items Modal */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            {selectedBom ? (
              <BomImport
                bomId={selectedBom.id}
                addBomItem={addBomItem}
                onImportComplete={(count) => {
                  setImportModalVisible(false);
                  // Reload items after import
                  loadBomItems();
                }}
                onCancel={() => setImportModalVisible(false)}
              />
            ) : (
              <View>
                <Text style={styles.placeholderText}>No BOM selected</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setImportModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  bomsList: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bomCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBomCard: {
    borderColor: '#2196F3',
  },
  bomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bomName: {
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
  projectName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bomInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  bomInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsPanel: {
    width: 350,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  detailsScrollView: {
    flex: 1,
  },
  detailsScrollContent: {
    padding: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
  },
  costLabelBold: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  costValueBold: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  costLabelGrand: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  costValueGrand: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  addItemButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyItems: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteItemText: {
    fontSize: 12,
    color: '#F44336',
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  itemDetails: {
    marginBottom: 4,
  },
  itemDetailText: {
    fontSize: 12,
    color: '#333',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  projectSelector: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  noProjectsText: {
    padding: 16,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  projectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedProjectOption: {
    backgroundColor: '#E3F2FD',
  },
  projectOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedProjectOptionText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  projectClientText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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

export default BomManagementScreen;
