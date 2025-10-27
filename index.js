/**
 * @format
 */

// Polyfill for react-native-bcrypt
import 'react-native-randombytes';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
