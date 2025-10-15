/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Skipping this test because it requires full app initialization with database,
// navigation, and many native modules. The important unit tests for services
// and models are in their respective test files.
test.skip('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
