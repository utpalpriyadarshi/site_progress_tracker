import NetInfo from '@react-native-community/netinfo';

export class OfflineService {
  private static isOnline = true;
  private static listeners: Array<(status: boolean) => void> = [];
  private static unsubscribe: (() => void) | null = null;

  static init() {
    // Unsubscribe from any existing listener
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Subscribe to network status updates
    this.unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected != null && state.isConnected;
      this.setOnlineStatus(isOnline);
    });

    // Check initial network status
    NetInfo.fetch().then(state => {
      const isOnline = state.isConnected != null && state.isConnected;
      this.setOnlineStatus(isOnline);
    });
  }

  static setOnlineStatus(status: boolean) {
    this.isOnline = status;
    this.notifyListeners();
  }

  static isDeviceOnline(): boolean {
    return this.isOnline;
  }

  static isDeviceOffline(): boolean {
    return !this.isOnline;
  }

  static addOnlineStatusListener(callback: (status: boolean) => void) {
    this.listeners.push(callback);
  }

  static removeOnlineStatusListener(callback: (status: boolean) => void) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  // Queue operations when offline to be executed when back online
  static async queueOperationWhenOffline<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isDeviceOnline()) {
      return operation();
    }

    // If offline, return a promise that will execute when we're back online
    return new Promise<T>((resolve, reject) => {
      const tryOperation = async () => {
        if (this.isDeviceOnline()) {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          // Still offline, wait a bit and try again
          setTimeout(tryOperation, 5000); // Retry every 5 seconds
        }
      };
      
      tryOperation();
    });
  }
}
