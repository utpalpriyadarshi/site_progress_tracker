// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
    enableExperimentalWebImplementation: jest.fn(),
  };
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb/react', () => ({
  withDatabase: jest.fn(Component => Component),
  withObservables: jest.fn(() => Component => Component),
  useDatabase: jest.fn(() => ({
    collections: {
      get: jest.fn(() => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
          observe: jest.fn(() => ({
            subscribe: jest.fn(),
          })),
        })),
        create: jest.fn(),
        find: jest.fn(),
      })),
    },
    write: jest.fn(callback => callback()),
  })),
}));

// Mock withObservables
jest.mock('@nozbe/with-observables', () => ({
  __esModule: true,
  default: jest.fn(() => Component => Component),
  withObservables: jest.fn(() => Component => Component),
}));

// Mock WatermelonDB SQLiteAdapter
jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  class MockSQLiteAdapter {
    constructor() {
      this.schema = null;
      this.migrations = null;
    }
    setUpWithSchema() {}
    setUpWithMigrations() {}
    getLocal() {}
    setLocal() {}
    removeLocal() {}
    query() {
      return Promise.resolve([]);
    }
    count() {
      return Promise.resolve(0);
    }
    batch() {
      return Promise.resolve();
    }
    getDeletedRecords() {
      return Promise.resolve([]);
    }
    destroyDeletedRecords() {
      return Promise.resolve();
    }
  }
  return {
    default: MockSQLiteAdapter,
  };
});

// Mock database module with proper object creation support
const createMockModel = (tableName, data, storage) => {
  const mockInstance = {
    id: `mock-${tableName}-${Date.now()}-${Math.random()}`,
    ...data,
  };

  // Add destroyPermanently method that removes from storage
  mockInstance.destroyPermanently = jest.fn(() => {
    const index = storage.findIndex(item => item.id === mockInstance.id);
    if (index !== -1) {
      storage.splice(index, 1);
    }
    return Promise.resolve();
  });

  // Add model-specific methods based on table name
  if (tableName === 'template_modules') {
    mockInstance.getItems = function() {
      try {
        return JSON.parse(this.itemsJson || '[]');
      } catch {
        return [];
      }
    };
    mockInstance.getCompatibleModuleIds = function() {
      try {
        return JSON.parse(this.compatibleModules || '[]');
      } catch {
        return [];
      }
    };
    mockInstance.getItemCount = function() {
      return this.getItems().length;
    };
    mockInstance.getEstimatedDuration = function() {
      const items = this.getItems();
      if (items.length === 0) return 0;
      return Math.max(...items.map(item => item.duration || 0));
    };
  } else if (tableName === 'interface_points') {
    mockInstance.isOverdue = function() {
      if (!this.targetDate) return false;
      if (this.status === 'resolved') return false;
      return Date.now() > this.targetDate;
    };
    mockInstance.getDaysOverdue = function() {
      if (!this.isOverdue()) return 0;
      const diffMs = Date.now() - this.targetDate;
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };
  } else if (tableName === 'items') {
    // ItemModel helper methods
    mockInstance.getDependencies = function() {
      if (!this.dependencies) return [];
      try {
        return JSON.parse(this.dependencies);
      } catch {
        return [];
      }
    };
    mockInstance.setDependencies = function(deps) {
      return JSON.stringify(deps);
    };
    mockInstance.getScheduleVariance = function() {
      if (!this.actualEndDate || !this.plannedEndDate) return 0;
      return Math.floor((this.actualEndDate - this.plannedEndDate) / (1000 * 60 * 60 * 24));
    };
    mockInstance.getPlannedDuration = function() {
      return Math.floor((this.plannedEndDate - this.plannedStartDate) / (1000 * 60 * 60 * 24));
    };
    mockInstance.getActualDuration = function() {
      if (!this.actualEndDate || !this.actualStartDate) return 0;
      return Math.floor((this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24));
    };
    mockInstance.getBaselineVariance = function() {
      if (!this.baselineEndDate || !this.plannedEndDate) return 0;
      return Math.floor((this.plannedEndDate - this.baselineEndDate) / (1000 * 60 * 60 * 24));
    };
    mockInstance.getProgressPercentage = function() {
      if (this.plannedQuantity === 0) return 0;
      return Math.min(100, (this.completedQuantity / this.plannedQuantity) * 100);
    };
    mockInstance.getFormattedWbsCode = function() {
      return this.wbsCode || 'N/A';
    };
    mockInstance.getIndentLevel = function() {
      return Math.max(0, this.wbsLevel - 1);
    };
    mockInstance.getPhaseLabel = function() {
      const labels = {
        design: '✏️ Design & Engineering',
        approvals: '📋 Statutory Approvals',
        mobilization: '🚛 Mobilization',
        procurement: '🛒 Procurement',
        interface: '🔗 Interface Coordination',
        site_prep: '🏗️ Site Preparation',
        construction: '🔨 Construction',
        testing: '🧪 Testing',
        commissioning: '⚡ Commissioning',
        sat: '✅ Site Acceptance Test',
        handover: '📦 Handover',
      };
      return labels[this.projectPhase] || 'Unknown';
    };
    mockInstance.getPhaseColor = function() {
      const colors = {
        design: '#2196F3',
        approvals: '#9C27B0',
        mobilization: '#FF5722',
        procurement: '#FF9800',
        interface: '#00BCD4',
        site_prep: '#795548',
        construction: '#4CAF50',
        testing: '#F44336',
        commissioning: '#3F51B5',
        sat: '#009688',
        handover: '#607D8B',
      };
      return colors[this.projectPhase] || '#666666';
    };
    mockInstance.isOnCriticalPath = function() {
      return this.isCriticalPath || (this.floatDays !== undefined && this.floatDays <= 0);
    };
    mockInstance.getRiskBadgeColor = function() {
      if (!this.dependencyRisk) return null;
      const colors = {
        low: null,
        medium: '#FFC107',
        high: '#F44336',
      };
      return colors[this.dependencyRisk];
    };
  }

  return mockInstance;
};

// In-memory storage for test data
const mockDatabaseStorage = {};

const mockDatabase = {
  collections: {
    get: jest.fn((tableName) => {
      // Initialize storage for this table if needed
      if (!mockDatabaseStorage[tableName]) {
        mockDatabaseStorage[tableName] = [];
      }

      return {
        query: jest.fn((...queryArgs) => ({
          fetch: jest.fn(() => {
            // Filter items based on query args
            let items = mockDatabaseStorage[tableName] || [];

            // Simple query filtering for WatermelonDB Q.where()
            queryArgs.forEach(arg => {
              if (arg && arg.type === 'where') {
                const field = arg.left;
                const operator = arg.operator;
                const value = arg.right;

                items = items.filter(item => {
                  if (operator === 'eq' || !operator) {
                    return item[field] === value;
                  } else if (operator === 'notEq') {
                    return item[field] !== value;
                  }
                  return true;
                });
              }
            });

            return Promise.resolve(items);
          }),
          observe: jest.fn(() => ({
            subscribe: jest.fn(),
          })),
        })),
        create: jest.fn((callback) => {
          // Create a mock model instance
          const data = {};
          // Call the callback to populate the data
          callback(data);
          // Create the full mock model with methods
          const mockInstance = createMockModel(tableName, data, mockDatabaseStorage[tableName]);
          // Store in mock database
          mockDatabaseStorage[tableName].push(mockInstance);
          // Return the populated instance
          return Promise.resolve(mockInstance);
        }),
        find: jest.fn((id) => {
          const item = mockDatabaseStorage[tableName]?.find(i => i.id === id);
          return Promise.resolve(item || null);
        }),
      };
    }),
  },
  write: jest.fn(async (callback) => {
    // Execute the callback and return its result
    return await callback();
  }),
  // Add method to clear storage between tests
  _clearMockStorage: () => {
    Object.keys(mockDatabaseStorage).forEach(key => {
      mockDatabaseStorage[key] = [];
    });
  },
};

jest.mock('./models/database', () => ({
  database: mockDatabase,
}));

// Mock react-native-paper Portal
jest.mock('react-native-paper', () => {
  const actualPaper = jest.requireActual('react-native-paper');
  return {
    ...actualPaper,
    Portal: ({ children }) => children,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return jest.fn(() => null);
});

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock PermissionsAndroid
jest.mock('react-native/Libraries/PermissionsAndroid/PermissionsAndroid', () => ({
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
  },
  request: jest.fn(() => Promise.resolve('granted')),
}));
