# Site Progress Tracker Project

## Project Overview

This is a **React Native** mobile application project named "site_progress_tracker" that was bootstrapped using `@react-native-community/cli`. The application is designed to help track progress on construction sites or similar work locations. It's built with React Native, TypeScript, and follows modern React Native project conventions.

### Key Technologies and Dependencies

- **React Native**: Version 0.81.4 - Cross-platform mobile development framework
- **React**: Version 19.1.0 - JavaScript library for building user interfaces
- **TypeScript**: Version ^5.8.3 - Superset of JavaScript that adds static typing
- **Babel**: For JavaScript/TypeScript transpilation
- **Metro**: JavaScript bundler for React Native
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Project Architecture

The project follows the standard React Native project structure:
- `App.tsx`: Main application component using the new-app-screen template
- `index.js`: Entry point that registers the app component
- `android/` and `ios/` directories: Native code for each platform
- `node_modules/`: Project dependencies
- Configuration files for various tools (babel, metro, eslint, etc.)

## Building and Running

### Prerequisites
- Node.js >= 20 (as specified in package.json engines)
- Ruby (for iOS CocoaPods) - Ruby >= 2.6.10 as specified in Gemfile
- For iOS development: Xcode and CocoaPods
- For Android development: Android Studio and Android SDK

### Setup and Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **iOS-specific setup** (first time only):
   ```bash
   bundle install
   bundle exec pod install
   ```

### Running the Application

1. **Start Metro bundler** (development server):
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Run on Android**:
   ```bash
   npm run android
   # or
   yarn android
   ```

3. **Run on iOS**:
   ```bash
   npm run ios
   # or
   yarn ios
   ```

### Development Commands

- **Testing**: `npm test` or `yarn test` - Run tests with Jest
- **Linting**: `npm run lint` or `yarn lint` - Check code style with ESLint
- **Fast Refresh**: When Metro is running, save changes to files to automatically reload them (powered by Fast Refresh)

## Development Conventions

### Code Style
- TypeScript is used for type safety
- ESLint with `@react-native` configuration for code linting
- Prettier for consistent code formatting
- Follows React Native best practices and React hooks conventions

### Component Structure
- Main component in `App.tsx` uses SafeAreaProvider for proper layout on devices with notches
- Uses React hooks like `useColorScheme` for dark mode support
- Styles are defined using React Native's StyleSheet API

### Testing
- Jest is configured for testing
- Test files are expected in the `__tests__/` directory

### Directory Structure
- `android/` - Android native code
- `ios/` - iOS native code  
- `__tests__/` - Test files
- `node_modules/` - NPM dependencies
- `prompts/` - Project-specific prompt files
- `.vscode/` - VS Code settings
- Root files contain configuration and main application code

## Project-Specific Notes

- The app uses the `@react-native/new-app-screen` component as a starting template
- React Native Safe Area Context is integrated to handle notches and display cutouts properly
- The project name "site_progress_tracker" suggests it's intended for tracking progress at physical sites, likely with features for logging, photos, checklists, etc.
- Fast Refresh is enabled by default for rapid development
- The project includes proper configuration for both iOS and Android platforms