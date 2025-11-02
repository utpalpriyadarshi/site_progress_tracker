# Project Overview

This is a React Native project named `site_progress_tracker`. Based on the file structure and dependencies, it appears to be a mobile application for tracking site progress. The project is bootstrapped with `@react-native-community/cli`.

The main technologies used are:
- **React Native:** For building the cross-platform mobile application.
- **TypeScript:** For static typing.
- **Jest:** For testing.
- **ESLint:** For linting.
- **Prettier:** For code formatting.

The project is structured with `android` and `ios` directories, indicating that it's a standard React Native project. The main application logic starts in `App.tsx`.

# Building and Running

To build and run the application, use the following commands:

**1. Start Metro:**
```sh
npm start
```

**2. Run on Android:**
```sh
npm run android
```

**3. Run on iOS:**
```sh
npm run ios
```
Before running on iOS for the first time, you may need to install the pods:
```sh
cd ios && pod install
```

# Development Conventions

- **Linting:** The project uses ESLint for code quality. Run `npm run lint` to check for linting errors.
- **Testing:** The project uses Jest for testing. Run `npm run test` to execute the test suite.
- **Code Style:** The project uses Prettier for code formatting. It's recommended to set up your editor to format on save.
