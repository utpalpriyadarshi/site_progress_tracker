/**
 * P4 - Key User Workflows Integration Tests
 *
 * This module exports all workflow integration tests for the four key user roles:
 *
 * 1. AdminWorkflow - User management, site setup, RBAC
 * 2. SupervisorWorkflow - Daily reporting, progress entry, hindrances
 * 3. ManagerWorkflow - Approvals, resource allocation, team management
 * 4. CommercialWorkflow - RFQ, invoicing, cost tracking
 *
 * Test Coverage Summary:
 * - Admin: 5 workflows, ~15 test cases
 * - Supervisor: 7 workflows, ~20 test cases
 * - Manager: 7 workflows, ~20 test cases
 * - Commercial: 8 workflows, ~20 test cases
 *
 * Total: ~75 integration test cases
 *
 * Run all workflow tests:
 *   npm test -- --testPathPattern="workflows"
 *
 * Run specific workflow:
 *   npm test -- --testPathPattern="AdminWorkflow"
 *   npm test -- --testPathPattern="SupervisorWorkflow"
 *   npm test -- --testPathPattern="ManagerWorkflow"
 *   npm test -- --testPathPattern="CommercialWorkflow"
 */

// Export test file paths for reference
export const workflowTestFiles = [
  'AdminWorkflow.integration.test.ts',
  'SupervisorWorkflow.integration.test.ts',
  'ManagerWorkflow.integration.test.ts',
  'CommercialWorkflow.integration.test.ts',
];

// Test categories for reporting
export const testCategories = {
  admin: {
    name: 'Admin Workflow',
    workflows: [
      'User Management (Create, Update, Deactivate)',
      'Site Setup (Project → Site → Assign Supervisor)',
      'Role-Based Access Control',
      'Session Management',
      'Bulk Operations',
    ],
  },
  supervisor: {
    name: 'Supervisor Workflow',
    workflows: [
      'Daily Reporting (Create, Submit, History)',
      'Progress Entry (Log, Update, Photos)',
      'Hindrance Reporting (Report, Escalate, Resolve)',
      'Site Inspection (Checklist, Rating, Photos)',
      'Material Tracking (Request, Receive, Use)',
      'Multi-Site Management',
      'Offline Progress Sync',
    ],
  },
  manager: {
    name: 'Manager Workflow',
    workflows: [
      'Resource Request Approval',
      'Team Management (Create, Assign, Transfer)',
      'Budget Oversight (BOM Review, Variance)',
      'Resource Allocation',
      'Project Oversight',
      'Hindrance Escalation Handling',
      'Dashboard Aggregation',
    ],
  },
  commercial: {
    name: 'Commercial Workflow',
    workflows: [
      'RFQ Creation and Issue',
      'Quote Submission and Evaluation',
      'Quote Award',
      'Invoice Management',
      'Cost Tracking and Variance Analysis',
      'RFQ Statistics and Reporting',
      'RFQ Cancellation',
      'Comparative Quote Analysis',
    ],
  },
};
