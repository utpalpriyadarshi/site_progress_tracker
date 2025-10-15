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

// Mock database module
jest.mock('./models/database', () => ({
  database: {
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
  },
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
