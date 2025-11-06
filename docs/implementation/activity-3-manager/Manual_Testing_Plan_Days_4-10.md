# Manual Testing Plan - Activity 3 Days 4-10

## Overview
This document provides a comprehensive manual testing plan for the Days 4-10 work, focusing on Team Member Assignment and Resource Request functionality.

## Test Environment Setup

### Prerequisites
- App installed and running
- Database migrated to v21 (3 tables: teams, team_members, resource_requests)
- At least one site created in the database
- Test data prepared (optional but recommended)

### Test User
- Role: Manager
- User ID: manager1 (or your actual manager user)

---

## Test Suite 1: Team Member Assignment

### Test Case 1.1: Open Team Member Assignment Modal
**Objective**: Verify the Team Member Assignment modal opens correctly

**Steps**:
1. Navigate to Team Management screen
2. Select an existing team from the list (or create one if none exist)
3. In the Team Details panel, click the "Manage" button in the Team Members section

**Expected Results**:
- ✅ Modal opens with title "Manage Team Members"
- ✅ Team name is displayed correctly-No
- ✅ Team specialization is shown-Yes
- ✅ Current member count is accurate-Count is not there
- ✅ Close button is visible in the header-No

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A
observation: 1)Title is Team Members, refer screenshot @prompts\team2.png,2) Infact after adding the team all above expected are visible.3) it must follow standard practice of CRUD for everything,4) while selecting worker it got hanged.5) Scren layout is not good
---

### Test Case 1.2: Display Current Team Members
**Objective**: Verify current team members are displayed correctly

**Pre-condition**: Team has at least 2 members assigned

**Steps**:
1. Open Team Member Assignment modal for a team with members
2. Scroll to "Current Team Members" section

**Expected Results**:
- ✅ All active members are listed
- ✅ Each member shows role badge (Lead/Supervisor/Worker)
- ✅ Role badges have correct colors (Blue/Green/Orange)
- ✅ Member count matches number of active members
- ✅ "Remove" button appears for each member

**Priority**: High
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.3: Display Empty State (No Members)
**Objective**: Verify empty state when team has no members

**Pre-condition**: Team has no members assigned

**Steps**:
1. Create a new team
2. Open Team Member Assignment modal for the new team
3. Check "Current Team Members" section

**Expected Results**:
- ✅ "No team members assigned yet" message is displayed
- ✅ No member cards are shown
- ✅ Current Members count shows 0

**Priority**: Medium
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.4: Role Selection
**Objective**: Verify role selection functionality

**Steps**:
1. Open Team Member Assignment modal
2. Scroll to "Assign New Member" section
3. Observe the role selector buttons
4. Click "Team Lead" button
5. Click "Supervisor" button
6. Click "Worker" button

**Expected Results**:
- ✅ Three role options are displayed: Team Lead, Supervisor, Worker
- ✅ Worker is selected by default
- ✅ Clicking a role button highlights it
- ✅ Only one role can be selected at a time
- ✅ Selected role button has visual distinction (background color, border)
- ✅ Assign button text updates to show selected role

**Priority**: High
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.5: User Search
**Objective**: Verify user search functionality

**Steps**:
1. Open Team Member Assignment modal
2. Scroll to "Select User" section
3. Note the initial list of available users
4. Type "John" in the search input
5. Clear search and type "jane@example.com"
6. Type "xyz123" (non-existent)

**Expected Results**:
- ✅ Search input is visible with placeholder text
- ✅ Typing "John" filters to show only John Doe
- ✅ Typing email filters by email correctly
- ✅ Non-existent search shows "No users found matching search" message
- ✅ Search is case-insensitive
- ✅ Users already assigned to team are not shown in available list

**Priority**: High
**Status**: [ ] Pass [Fail ] Fail [ ] N/A
 
---

### Test Case 1.6: User Selection
**Objective**: Verify user selection from available list

**Steps**:
1. Open Team Member Assignment modal
2. Click on a user card (e.g., "Bob Johnson")
3. Observe the visual feedback
4. Click on a different user

**Expected Results**:
- ✅ Clicked user card is highlighted (blue border, blue background)
- ✅ Checkmark (✓) appears on selected user card
- ✅ Only one user can be selected at a time
- ✅ "Assign as [Role]" button appears below the user list
- ✅ Clicking different user deselects previous selection

**Priority**: High
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.7: Assign Member - Success
**Objective**: Verify successful member assignment

**Steps**:
1. Open Team Member Assignment modal for a team
2. Select role "Supervisor"
3. Search and select user "Alice Williams"
4. Click "Assign as Supervisor" button
5. Wait for operation to complete

**Expected Results**:
- ✅ Loading state is shown during assignment
- ✅ Success alert appears: "Team member assigned successfully"
- ✅ User is added to "Current Team Members" section
- ✅ User shows correct role badge (Supervisor - Green)
- ✅ User is removed from available users list
- ✅ Search input and selection are cleared
- ✅ Member count is incremented
- ✅ onAssigned callback is triggered (TeamManagementScreen reloads members)

**Priority**: Critical
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.8: Assign Member - No User Selected
**Objective**: Verify validation when no user is selected

**Steps**:
1. Open Team Member Assignment modal
2. Select a role but don't select any user
3. Try to find assign button

**Expected Results**:
- ✅ "Assign as [Role]" button does not appear
- ✅ User cannot proceed without selecting a user

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.9: Remove Member - Confirmation
**Objective**: Verify remove member shows confirmation dialog

**Steps**:
1. Open Team Member Assignment modal for a team with members
2. Click "Remove" button for a member
3. Observe the confirmation dialog

**Expected Results**:
- ✅ Alert dialog appears with title "Remove Member"
- ✅ Dialog message includes member name
- ✅ Dialog has "Cancel" button
- ✅ Dialog has "Remove" button (red/destructive style)

**Priority**: High
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.10: Remove Member - Success
**Objective**: Verify successful member removal

**Steps**:
1. Open Team Member Assignment modal
2. Note the current member count
3. Click "Remove" for a member
4. Click "Remove" in confirmation dialog
5. Wait for operation to complete

**Expected Results**:
- ✅ Loading state is shown during removal
- ✅ Success alert appears: "Team member removed successfully"
- ✅ Member is removed from "Current Team Members" section
- ✅ Member appears in available users list
- ✅ Member count is decremented
- ✅ onAssigned callback is triggered

**Priority**: Critical
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.11: Remove Member - Cancel
**Objective**: Verify canceling member removal

**Steps**:
1. Open Team Member Assignment modal
2. Click "Remove" for a member
3. Click "Cancel" in confirmation dialog

**Expected Results**:
- ✅ Dialog closes
- ✅ Member remains in the team
- ✅ No changes to member list
- ✅ Member count unchanged

**Priority**: Medium
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.12: Close Modal
**Objective**: Verify closing the modal

**Steps**:
1. Open Team Member Assignment modal
2. Make some changes (select a role, search users)
3. Click "Close" button in header
4. Reopen the modal

**Expected Results**:
- ✅ Modal closes and returns to TeamManagementScreen
- ✅ onClose callback is triggered
- ✅ No data is saved if "Assign" button wasn't clicked
- ✅ Reopening modal resets to initial state

**Priority**: Medium
**Status**: [ok ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.13: Error Handling - Assign Failure
**Objective**: Verify error handling when assignment fails

**Pre-condition**: Simulate network error or database issue

**Steps**:
1. Open Team Member Assignment modal
2. Select role and user
3. Click "Assign as [Role]"
4. (If possible, disconnect network or cause error)

**Expected Results**:
- ✅ Error alert appears: "Failed to assign team member"
- ✅ User remains unassigned
- ✅ UI returns to stable state
- ✅ User can retry the operation

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A
observation: couldnot test
---

### Test Case 1.14: Error Handling - Remove Failure
**Objective**: Verify error handling when removal fails

**Pre-condition**: Simulate error condition

**Steps**:
1. Open Team Member Assignment modal
2. Click "Remove" for a member
3. Confirm removal
4. (Simulate error)

**Expected Results**:
- ✅ Error alert appears: "Failed to remove team member"
- ✅ Member remains in the team
- ✅ UI returns to stable state
- ✅ User can retry the operation

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 1.15: Loading States
**Objective**: Verify loading indicators appear during operations

**Steps**:
1. Open Team Member Assignment modal (observe initial load)
2. Assign a member (observe loading during assignment)
3. Remove a member (observe loading during removal)

**Expected Results**:
- ✅ Loading spinner appears while fetching team data
- ✅ Loading spinner appears during assign operation
- ✅ Loading spinner appears during remove operation
- ✅ UI is disabled/blocked during loading
- ✅ Loading states clear after operation completes

**Priority**: Low
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

## Test Suite 2: Resource Requests Screen

### Test Case 2.1: Screen Navigation and Layout
**Objective**: Verify screen renders with proper layout

**Steps**:
1. Navigate to Resource Requests screen
2. Observe the header and tabs

**Expected Results**:
- ✅ Screen title "Resource Requests" is displayed-No ( Resource Allocation)
- ✅ Two tabs are visible: "Create Request" and "Approval Queue"-No tabs are there
- ✅ "Create Request" tab is active by default-Nothing is there
- ✅ Active tab has visual indicator (blue underline)-No

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:- Not passed
---

### Test Case 2.2: Tab Switching
**Objective**: Verify tab switching functionality

**Steps**:
1. Open Resource Requests screen
2. Verify "Create Request" tab is active
3. Click "Approval Queue" tab
4. Click "Create Request" tab again

**Expected Results**:
- ✅ Clicking "Approval Queue" switches to ApprovalQueue component
- ✅ Active tab indicator moves to clicked tab
- ✅ Tab text color changes to indicate active state
- ✅ Clicking "Create Request" switches back to ResourceRequestForm
- ✅ Only one tab content is visible at a time

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:- Not passed
---

### Test Case 2.3: Create Request Tab Content
**Objective**: Verify ResourceRequestForm is displayed correctly

**Steps**:
1. Open Resource Requests screen
2. Ensure "Create Request" tab is active
3. Observe the form content

**Expected Results**:
- ✅ ResourceRequestForm component is rendered
- ✅ Form has resource type selector
- ✅ Form has all required input fields
- ✅ Form has submit button
- ✅ currentUserId prop is passed to form

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:- not passed
---

### Test Case 2.4: Approval Queue Tab Content
**Objective**: Verify ApprovalQueue is displayed correctly

**Steps**:
1. Open Resource Requests screen
2. Click "Approval Queue" tab
3. Observe the queue content

**Expected Results**:
- ✅ ApprovalQueue component is rendered
- ✅ Queue shows list of pending requests
- ✅ Queue has filter controls
- ✅ Queue has approve/reject buttons
- ✅ currentUserId prop is passed to queue

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:-Not passed
---

### Test Case 2.5: Tab State Persistence
**Objective**: Verify tab state persists during screen lifecycle

**Steps**:
1. Open Resource Requests screen
2. Switch to "Approval Queue" tab
3. Navigate away from screen
4. Navigate back to Resource Requests screen

**Expected Results**:
- ✅ Screen remembers selected tab (or resets to default)
- ✅ No crashes or errors
- ✅ Data is reloaded correctly

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:-Not passed
---

## Test Suite 3: Integration with TeamManagementScreen

### Test Case 3.1: Team Member Assignment from Team Details
**Objective**: Verify integration between TeamManagementScreen and TeamMemberAssignment

**Steps**:
1. Navigate to Team Management screen
2. Create or select a team
3. In Team Details panel, verify member count
4. Click "Manage" button
5. Assign a new member
6. Close the assignment modal

**Expected Results**:
- ✅ "Manage" button appears in Team Members section
- ✅ TeamMemberAssignment modal opens with correct team ID
- ✅ After assigning member, TeamManagementScreen reloads member list
- ✅ Team Details panel shows updated member count
- ✅ New member appears in Team Members list with correct role

**Priority**: Critical
**Status**: [ ] Pass [ ] Fail [ ] N/A
Observation:-Not passed
---

### Test Case 3.2: Member Count Accuracy
**Objective**: Verify member count is accurate across operations

**Steps**:
1. Select a team with known member count (e.g., 2 members)
2. Open assignment modal and verify count matches
3. Assign a new member
4. Verify count increments to 3
5. Remove a member
6. Verify count decrements to 2

**Expected Results**:
- ✅ Initial count is accurate
- ✅ Count updates after assignment
- ✅ Count updates after removal
- ✅ Count shown in modal matches count in Team Details panel

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 3.3: Filter Active Members Only
**Objective**: Verify only active members are displayed

**Pre-condition**: Team has both active and inactive members

**Steps**:
1. Select a team
2. Open Team Details panel
3. Open TeamMemberAssignment modal
4. Check member lists

**Expected Results**:
- ✅ Team Details shows only active members
- ✅ TeamMemberAssignment "Current Team Members" shows only active members
- ✅ Inactive/transferred members are not displayed
- ✅ Member count excludes inactive members

**Priority**: High
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

## Test Suite 4: End-to-End Workflow

### Test Case 4.1: Complete Team Creation and Assignment Workflow
**Objective**: Verify complete workflow from team creation to member assignment

**Steps**:
1. Navigate to Team Management screen
2. Click "+ Add Team"
3. Enter team name: "E2E Test Team"
4. Enter specialization: "Plumbing"
5. Select a site
6. Click "Create Team"
7. Select the newly created team
8. Verify it shows 0 members
9. Click "Manage" button
10. Select role "Team Lead"
11. Select user "John Doe"
12. Click "Assign as Team Lead"
13. Select role "Worker"
14. Select user "Jane Smith"
15. Click "Assign as Worker"
16. Close modal
17. Verify team details

**Expected Results**:
- ✅ Team is created successfully
- ✅ Team appears in team list
- ✅ Initially shows 0 members
- ✅ First assignment succeeds (John Doe as Lead)
- ✅ Second assignment succeeds (Jane Smith as Worker)
- ✅ Team Details shows 2 members
- ✅ Both members visible with correct roles
- ✅ No errors throughout the workflow

**Priority**: Critical
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 4.2: Complete Resource Request Workflow
**Objective**: Verify complete workflow from request creation to approval

**Steps**:
1. Navigate to Resource Requests screen
2. Ensure "Create Request" tab is active
3. Fill in request form:
   - Resource Type: Equipment
   - Resource Name: "Excavator"
   - Quantity: 1
   - Priority: High
   - Select site
   - Set needed by date
4. Submit request
5. Switch to "Approval Queue" tab
6. Find the newly created request
7. Approve the request

**Expected Results**:
- ✅ Request form validates correctly
- ✅ Request is created successfully
- ✅ Request appears in Approval Queue
- ✅ Request shows correct priority (High - Orange)
- ✅ Request can be approved
- ✅ Approval updates request status
- ✅ No errors throughout the workflow

**Priority**: Critical
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

## Test Suite 5: Performance and UX

### Test Case 5.1: Modal Load Performance
**Objective**: Verify TeamMemberAssignment modal loads quickly

**Steps**:
1. Select a team
2. Click "Manage" button
3. Measure time until modal is fully loaded

**Expected Results**:
- ✅ Modal opens within 1 second
- ✅ Team data loads quickly
- ✅ No visible lag or freezing
- ✅ Loading spinner appears if loading takes > 300ms

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 5.2: Search Responsiveness
**Objective**: Verify search input is responsive

**Steps**:
1. Open TeamMemberAssignment modal
2. Type quickly in search input
3. Observe filter results

**Expected Results**:
- ✅ Input updates without lag
- ✅ Results filter in real-time
- ✅ No stuttering or freezing
- ✅ Search feels instant

**Priority**: Low
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 5.3: Large Team Performance
**Objective**: Verify performance with many team members

**Pre-condition**: Create a team with 20+ members (if possible)

**Steps**:
1. Open TeamMemberAssignment modal for large team
2. Scroll through member list
3. Search for users
4. Assign/remove members

**Expected Results**:
- ✅ Modal loads without delay
- ✅ Scrolling is smooth
- ✅ Search remains responsive
- ✅ No performance degradation

**Priority**: Low
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

## Test Suite 6: Edge Cases and Error Scenarios

### Test Case 6.1: Empty Site List
**Objective**: Verify behavior when no sites exist

**Pre-condition**: Empty sites table

**Steps**:
1. Navigate to Team Management
2. Try to create a team

**Expected Results**:
- ✅ Site selector shows empty state or error message
- ✅ User is informed no sites are available
- ✅ Cannot create team without site

**Priority**: Low
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 6.2: All Users Already Assigned
**Objective**: Verify behavior when all users are assigned to teams

**Pre-condition**: All available users are assigned

**Steps**:
1. Open TeamMemberAssignment modal
2. Check available users list

**Expected Results**:
- ✅ "No available users to assign" message is shown
- ✅ No users appear in the list
- ✅ Assign button doesn't appear

**Priority**: Low
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

### Test Case 6.3: Rapid Operations
**Objective**: Verify handling of rapid consecutive operations

**Steps**:
1. Open TeamMemberAssignment modal
2. Quickly assign multiple users
3. Quickly remove multiple users
4. Rapidly switch between tabs in ResourceRequestsScreen

**Expected Results**:
- ✅ All operations complete successfully
- ✅ No race conditions
- ✅ Data consistency maintained
- ✅ No crashes or errors

**Priority**: Medium
**Status**: [ ] Pass [ ] Fail [ ] N/A

---

## Test Execution Summary

### Total Test Cases: 36

#### By Priority:
- **Critical**: 4 test cases
- **High**: 16 test cases
- **Medium**: 12 test cases
- **Low**: 4 test cases

#### By Test Suite:
- **Team Member Assignment**: 15 test cases
- **Resource Requests Screen**: 5 test cases
- **Integration**: 3 test cases
- **End-to-End Workflow**: 2 test cases
- **Performance and UX**: 3 test cases
- **Edge Cases**: 3 test cases

### Test Execution Log

| Test Case | Tester | Date | Result | Notes |
|-----------|--------|------|--------|-------|
| 1.1 | | | | |
| 1.2 | | | | |
| ... | | | | |

### Issues Found

| Issue # | Severity | Test Case | Description | Status |
|---------|----------|-----------|-------------|--------|
| | | | | |

### Sign-off

- Tester Name: _______________________
- Date: _______________________
- Overall Result: [ ] Pass [ ] Fail [ ] Conditional Pass

**Notes**:
I disnot like the UI & UX, functionalities are also not good, we have created admin,supervisor, planner scrrens and their tabs, they are much better than manager, please follow same pattern everywher. I would suggest please go through the project carefully and then discuss and execute.
Not happy, 