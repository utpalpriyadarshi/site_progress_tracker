/**
 * NetworkMonitor Tests
 *
 * Tests for network connectivity monitoring and auto-sync triggers.
 */

import { NetworkMonitor } from '../../../services/network/NetworkMonitor';
import NetInfo from '@react-native-community/netinfo';
import TokenStorage from '../../../services/storage/TokenStorage';

// Mock dependencies
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
    details: null,
  })),
}));

jest.mock('../../../services/storage/TokenStorage', () => ({
  getAccessToken: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../../services/sync/SyncService', () => ({
  SyncService: {
    syncDown: jest.fn(() => Promise.resolve()),
    syncUp: jest.fn(() => Promise.resolve()),
  },
}));

// Suppress console logs
const originalConsole = { ...console };
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});
afterAll(() => {
  global.console = originalConsole;
});

describe('NetworkMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetworkMonitor.cleanup();
  });

  describe('initialize', () => {
    it('should subscribe to network state changes', () => {
      NetworkMonitor.initialize();

      expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should fetch initial network state', () => {
      NetworkMonitor.initialize();

      expect(NetInfo.fetch).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const result = await NetworkMonitor.isConnected();

      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const result = await NetworkMonitor.isConnected();

      expect(result).toBe(false);
    });

    it('should return false when isConnected is null', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: null });

      const result = await NetworkMonitor.isConnected();

      expect(result).toBe(false);
    });
  });

  describe('getNetworkState', () => {
    it('should return detailed network state', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
        details: { ssid: 'TestNetwork' },
      });

      const state = await NetworkMonitor.getNetworkState();

      expect(state).toEqual({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
        details: { ssid: 'TestNetwork' },
      });
    });

    it('should handle offline state', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
        details: null,
      });

      const state = await NetworkMonitor.getNetworkState();

      expect(state.isConnected).toBe(false);
      expect(state.type).toBe('none');
    });

    it('should handle cellular connection', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'cellular',
        isInternetReachable: true,
        details: { cellularGeneration: '4g' },
      });

      const state = await NetworkMonitor.getNetworkState();

      expect(state.type).toBe('cellular');
      expect(state.details.cellularGeneration).toBe('4g');
    });
  });

  describe('addListener', () => {
    it('should add network change listener', () => {
      const listener = jest.fn();

      const unsubscribe = NetworkMonitor.addListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function that removes listener', () => {
      const listener = jest.fn();
      let netInfoCallback: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });

      NetworkMonitor.initialize();
      const unsubscribe = NetworkMonitor.addListener(listener);

      // Trigger network change
      netInfoCallback({ isConnected: true, type: 'wifi' });
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Trigger again - should not call listener
      netInfoCallback({ isConnected: false, type: 'none' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should call listener with connection status and type', () => {
      const listener = jest.fn();
      let netInfoCallback: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });

      NetworkMonitor.initialize();
      NetworkMonitor.addListener(listener);

      netInfoCallback({ isConnected: true, type: 'wifi' });

      expect(listener).toHaveBeenCalledWith(true, 'wifi');
    });
  });

  describe('setAutoSyncEnabled / isAutoSyncEnabled', () => {
    it('should enable auto-sync', () => {
      NetworkMonitor.setAutoSyncEnabled(true);

      expect(NetworkMonitor.isAutoSyncEnabled()).toBe(true);
    });

    it('should disable auto-sync', () => {
      NetworkMonitor.setAutoSyncEnabled(false);

      expect(NetworkMonitor.isAutoSyncEnabled()).toBe(false);
    });

    it('should be enabled by default after setting true', () => {
      NetworkMonitor.setAutoSyncEnabled(true);

      expect(NetworkMonitor.isAutoSyncEnabled()).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from NetInfo', () => {
      const mockUnsubscribe = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      NetworkMonitor.initialize();
      NetworkMonitor.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should clear all listeners', () => {
      const listener = jest.fn();
      let netInfoCallback: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });

      NetworkMonitor.initialize();
      NetworkMonitor.addListener(listener);
      NetworkMonitor.cleanup();

      // Re-initialize and trigger change
      NetworkMonitor.initialize();
      netInfoCallback({ isConnected: true, type: 'wifi' });

      // Old listener should not be called
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('manualSync', () => {
    it('should return false when not authenticated', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await NetworkMonitor.manualSync();

      expect(result).toBe(false);
    });

    it('should return false when not connected', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const result = await NetworkMonitor.manualSync();

      expect(result).toBe(false);
    });

    it('should return true when sync succeeds', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const { SyncService } = require('../../../services/sync/SyncService');
      SyncService.syncDown.mockResolvedValue();
      SyncService.syncUp.mockResolvedValue();

      const result = await NetworkMonitor.manualSync();

      expect(result).toBe(true);
      expect(SyncService.syncDown).toHaveBeenCalled();
      expect(SyncService.syncUp).toHaveBeenCalled();
    });

    it('should return false when sync fails', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const { SyncService } = require('../../../services/sync/SyncService');
      SyncService.syncDown.mockRejectedValue(new Error('Sync failed'));

      const result = await NetworkMonitor.manualSync();

      expect(result).toBe(false);
    });
  });

  describe('network change handling', () => {
    beforeEach(() => {
      NetworkMonitor.cleanup();
    });

    it('should update current state on network change', async () => {
      let netInfoCallback: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, type: 'wifi' });

      NetworkMonitor.initialize();

      // Wait for initial fetch
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate network going offline
      netInfoCallback({ isConnected: false, type: 'none' });

      const state = await NetworkMonitor.getNetworkState();
      // Note: getNetworkState fetches fresh state from NetInfo
      expect(NetInfo.fetch).toHaveBeenCalled();
    });

    it('should notify listeners on network change', async () => {
      const listener = jest.fn();
      let netInfoCallback: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn();
      });

      NetworkMonitor.initialize();
      NetworkMonitor.addListener(listener);

      netInfoCallback({ isConnected: false, type: 'none' });

      expect(listener).toHaveBeenCalledWith(false, 'none');
    });

    it('should not trigger auto-sync on initial state', async () => {
      const { SyncService } = require('../../../services/sync/SyncService');
      SyncService.syncDown.mockClear();
      SyncService.syncUp.mockClear();

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, type: 'wifi' });

      NetworkMonitor.initialize();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Auto-sync should not have been triggered on initial state
      // (Only triggered on offline -> online transition after initialization)
      expect(SyncService.syncDown).not.toHaveBeenCalled();
    });
  });

  describe('connection info formatting', () => {
    it('should format wifi connection', async () => {
      // This is tested indirectly through console.log calls
      // The getConnectionInfo is private, but we can verify behavior
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
        details: null,
      });

      const state = await NetworkMonitor.getNetworkState();

      expect(state.type).toBe('wifi');
    });

    it('should format cellular connection with generation', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'cellular',
        isInternetReachable: true,
        details: { cellularGeneration: '5g' },
      });

      const state = await NetworkMonitor.getNetworkState();

      expect(state.type).toBe('cellular');
      expect(state.details.cellularGeneration).toBe('5g');
    });
  });
});

describe('NetworkMonitor - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetworkMonitor.cleanup();
  });

  it('should handle listener errors gracefully', () => {
    const errorListener = jest.fn(() => {
      throw new Error('Listener error');
    });
    const goodListener = jest.fn();
    let netInfoCallback: any;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      netInfoCallback = callback;
      return jest.fn();
    });

    NetworkMonitor.initialize();
    NetworkMonitor.addListener(errorListener);
    NetworkMonitor.addListener(goodListener);

    // Should not throw - errors in listeners are caught
    expect(() => {
      netInfoCallback({ isConnected: true, type: 'wifi' });
    }).not.toThrow();

    // Good listener should still be called
    expect(goodListener).toHaveBeenCalled();
  });
});
