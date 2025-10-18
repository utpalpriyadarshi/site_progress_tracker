// Jest setup file that runs after the test environment is set up
// This file is loaded for each test file

// Import the mock database storage reference
// Note: This relies on the mock being set up in jest.setup.js first

// Global beforeEach hook to clear mock storage between tests
// This ensures test isolation and prevents state pollution
beforeEach(() => {
  // Access the database mock and clear its storage
  const { database } = require('./models/database');
  if (database && database._clearMockStorage) {
    database._clearMockStorage();
  }
});
