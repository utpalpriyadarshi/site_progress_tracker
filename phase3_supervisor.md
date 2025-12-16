Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Phase 3 - Task 3.1: Navigation UX Restructure

 Objective: Transform supervisor navigation from 7 bottom tabs 
  to a hybrid drawer + 5 tabs architecture with a new
 Dashboard screen.

 Estimated Time: 17-23 hours (10 implementation days)

 ---
 Current State Analysis

 Current Navigation (src/nav/SupervisorNavigator.tsx):
 - 7 bottom tabs (overcrowded)
 - No dashboard/overview screen
 - All features at same hierarchy level
 - Navigation: React Navigation v7 (tabs only)

 Current Tabs:
 1. SiteManagement
 2. ItemsManagement
 3. DailyReports
 4. MaterialTracking
 5. HindranceReport
 6. SiteInspection
 7. ReportsHistory

 ---
 Target Architecture

 Hybrid Navigation Structure

 SupervisorDrawerNavigator (Drawer)
 └── SupervisorTabNavigator (Bottom Tabs - 5 tabs)
     ├── Dashboard (NEW) - Overview & KPIs
     ├── Sites - Site Management
     ├── Items - Items Management
     ├── Daily Work - Daily Reports
     └── More - Drawer trigger (icon only)

 Drawer Contents (4 screens):
 ├── Materials - Material Tracking
 ├── Issues - Hindrance Reports
 ├── Inspection - Site Inspection
 └── History - Reports History

 Why This Structure:
 - Primary daily tasks (Dashboard, Sites, Items, Daily Work)   
 remain easily accessible
 - Secondary/periodic tasks move to drawer (reduces visual     
 clutter)
 - "More" tab acts as drawer trigger for discoverability       
 - Follows industry patterns (WhatsApp, Telegram, Slack)       

 ---
 Implementation Plan

 Phase 1: Setup & Dependencies (2 hours)

 Install Dependencies:
 npm install @react-navigation/drawer
 npm install react-native-reanimated
 react-native-gesture-handler

 Configuration:
 - Update babel.config.js for react-native-reanimated plugin   
 - Add reanimated plugin to babel plugins array

 Files to Create:
 src/supervisor/dashboard/
 ├── DashboardScreen.tsx
 ├── components/
 │   ├── MetricCard.tsx
 │   ├── QuickActionButton.tsx
 │   └── AlertsSection.tsx
 └── hooks/
     └── useDashboardData.ts

 ---
 Phase 2: Dashboard Screen Implementation (8-10 hours)

 2.1 Create MetricCard Component (2h)

 File: src/supervisor/dashboard/components/MetricCard.tsx      

 Props:
 - title: string
 - value: number | string
 - icon: string (Material Icons)
 - color: string
 - trend?: { value: number, direction: 'up' | 'down' }
 - loading?: boolean

 Features:
 - Loading skeleton (reuse Phase 2 pattern)
 - Icon with color accent
 - Large value display
 - Optional trend indicator
 - Touchable ripple effect

 Reference: LogisticsDashboardScreen.tsx (KPI cards pattern)   

 ---
 2.2 Create DashboardScreen (4-5h)

 File: src/supervisor/dashboard/DashboardScreen.tsx

 Layout Sections:
 1. Header: Date, sync status, refresh button
 2. KPI Grid (2x2):
   - Active Sites (count of supervisor's sites)
   - Today's Progress (items updated today)
   - Pending Items (items not completed)
   - Reports Submitted (today's report count)
 3. Quick Actions (horizontal scroll):
   - Update Progress → Daily Reports
   - Add Inspection → Site Inspection
   - Report Issue → Hindrance Reports
   - Track Materials → Material Tracking
 4. Alerts Section:
   - Items exceeding planned quantity
   - Overdue inspections
   - Pending report submissions

 Data Sources (WatermelonDB queries):
 // Active Sites
 database.collections.get('sites')
   .query(Q.where('supervisor_id', supervisorId))
   .fetch()

 // Today's Progress
 database.collections.get('item_progress')
   .query(Q.where('updated_at', Q.gte(startOfToday)))
   .fetch()

 // Pending Items
 database.collections.get('items')
   .query(Q.where('actual_quantity',
 Q.lt(Q.column('planned_quantity'))))
   .fetch()

 // Reports Submitted
 database.collections.get('daily_reports')
   .query(Q.where('submitted_at', Q.gte(startOfToday)))        
   .fetch()

 State Management:
 - Use useState for data
 - RefreshControl for pull-to-refresh
 - Loading skeletons during initial load
 - Error boundary wrapper

 Reference Files:
 - src/logistics/LogisticsDashboardScreen.tsx (KPI pattern,    
 Promise.all)
 - src/commercial/CommercialDashboardScreen.tsx (alerts        
 pattern)

 ---
 2.3 Create useDashboardData Hook (2h)

 File: src/supervisor/dashboard/hooks/useDashboardData.ts      

 Responsibilities:
 - Fetch all dashboard metrics in parallel (Promise.all)       
 - Handle loading/error states
 - Implement refresh logic
 - Calculate trends (compare to yesterday)

 Return Value:
 {
   metrics: {
     activeSites: number,
     todayProgress: number,
     pendingItems: number,
     reportsSubmitted: number
   },
   alerts: Alert[],
   loading: boolean,
   error: string | null,
   refresh: () => Promise<void>
 }

 ---
 Phase 3: Navigation Restructure (6-8 hours)

 3.1 Create SupervisorDrawerNavigator (2h)

 File: src/nav/SupervisorDrawerNavigator.tsx

 Structure:
 import { createDrawerNavigator } from
 '@react-navigation/drawer';

 const Drawer =
 createDrawerNavigator<SupervisorDrawerParamList>();

 export const SupervisorDrawerNavigator = () => {
   return (
     <SiteProvider>
       <Drawer.Navigator
         screenOptions={{
           headerShown: false,
           drawerType: 'front',
           drawerStyle: { width: 280 }
         }}
       >
         {/* Main content - Tab Navigator */}
         <Drawer.Screen
           name="SupervisorTabs"
           component={SupervisorTabNavigator}
           options={{ drawerItemStyle: { display: 'none' } }}  
         />

         {/* Drawer Items */}
         <Drawer.Screen name="Materials"
 component={MaterialTrackingScreen} />
         <Drawer.Screen name="Issues"
 component={HindranceReportScreen} />
         <Drawer.Screen name="Inspection"
 component={SiteInspectionScreen} />
         <Drawer.Screen name="History"
 component={ReportsHistoryScreen} />
       </Drawer.Navigator>
     </SiteProvider>
   );
 };

 Type Definitions:
 export type SupervisorDrawerParamList = {
   SupervisorTabs: undefined;
   Materials: undefined;
   Issues: undefined;
   Inspection: undefined;
   History: undefined;
 };

 ---
 3.2 Refactor SupervisorTabNavigator (3h)

 File: src/nav/SupervisorNavigator.tsx (rename to
 SupervisorTabNavigator.tsx)

 New Tab Structure (5 tabs):
 const Tab =
 createBottomTabNavigator<SupervisorTabParamList>();

 export const SupervisorTabNavigator = () => {
   const navigation = useNavigation<DrawerNavigationProp<Super 
 visorDrawerParamList>>();

   return (
     <Tab.Navigator
       screenOptions={{
         headerShown: false,
         tabBarActiveTintColor: '#6200ee',
       }}
     >
       <Tab.Screen
         name="Dashboard"
         component={DashboardScreen}
         options={{
           tabBarIcon: ({ color, size }) => (
             <Icon name="dashboard" size={size} color={color}  
 />
           ),
         }}
       />

       <Tab.Screen
         name="Sites"
         component={SiteManagementScreen}
         options={{
           tabBarIcon: ({ color, size }) => (
             <Icon name="location-city" size={size}
 color={color} />
           ),
         }}
       />

       <Tab.Screen
         name="Items"
         component={ItemsManagementScreen}
         options={{
           tabBarIcon: ({ color, size }) => (
             <Icon name="inventory" size={size} color={color}  
 />
           ),
         }}
       />

       <Tab.Screen
         name="DailyWork"
         component={DailyReportsScreen}
         options={{
           tabBarLabel: 'Daily Work',
           tabBarIcon: ({ color, size }) => (
             <Icon name="today" size={size} color={color} />   
           ),
         }}
       />

       <Tab.Screen
         name="More"
         component={EmptyMoreScreen}
         options={{
           tabBarIcon: ({ color, size }) => (
             <Icon name="menu" size={size} color={color} />    
           ),
         }}
         listeners={{
           tabPress: (e) => {
             e.preventDefault();
             navigation.openDrawer();
           },
         }}
       />
     </Tab.Navigator>
   );
 };

 Type Definitions:
 export type SupervisorTabParamList = {
   Dashboard: undefined;
   Sites: undefined;
   Items: undefined;
   DailyWork: undefined;
   More: undefined;
 };

 EmptyMoreScreen Component:
 // Placeholder component that's never actually shown
 // Tab press listener opens drawer instead
 const EmptyMoreScreen = () => null;

 ---
 3.3 Update RootNavigator (1h)

 File: src/nav/RootNavigator.tsx

 Change:
 // BEFORE
 <Stack.Screen name="Supervisor"
 component={SupervisorNavigator} />

 // AFTER
 <Stack.Screen name="Supervisor"
 component={SupervisorDrawerNavigator} />

 Import Update:
 import { SupervisorDrawerNavigator } from
 './SupervisorDrawerNavigator';

 ---
 Phase 4: Screen Wrappers & Error Handling (2 hours)

 Update All Screens:
 - Wrap each screen with ErrorBoundary (from Phase 1)
 - Add consistent header styling
 - Ensure SiteContext compatibility
 - Test deep linking paths

 Screens to Update:
 - MaterialTrackingScreen
 - HindranceReportScreen
 - SiteInspectionScreen
 - ReportsHistoryScreen

 Pattern:
 const WrappedMaterialTracking = () => (
   <ErrorBoundary screenName="MaterialTracking">
     <MaterialTrackingScreen />
   </ErrorBoundary>
 );

 ---
 Phase 5: Testing & Refinement (2-3 hours)

 Test Cases:
 1. ✅ Dashboard loads with correct KPIs
 2. ✅ Bottom tabs navigate correctly
 3. ✅ "More" tab opens drawer
 4. ✅ Drawer items navigate correctly
 5. ✅ Quick actions navigate to correct screens
 6. ✅ Back button works correctly from all screens
 7. ✅ Deep linking still works
 8. ✅ SiteContext persists across navigation
 9. ✅ Pull-to-refresh works on Dashboard
 10. ✅ Loading skeletons appear during data fetch

 Performance Checks:
 - Dashboard loads in <2 seconds
 - Tab transitions are smooth (60fps)
 - Drawer animation is smooth
 - No memory leaks on navigation

 Backwards Compatibility:
 - All existing navigation paths still work
 - No breaking changes to screen props
 - Context providers work as before

 ---
 Files Summary

 New Files (6 files)

 1. src/nav/SupervisorDrawerNavigator.tsx - Drawer wrapper     
 2. src/supervisor/dashboard/DashboardScreen.tsx - Main        
 dashboard
 3. src/supervisor/dashboard/components/MetricCard.tsx - KPI   
 card
 4. src/supervisor/dashboard/components/QuickActionButton.tsx  
 - Action button
 5. src/supervisor/dashboard/components/AlertsSection.tsx -    
 Alerts list
 6. src/supervisor/dashboard/hooks/useDashboardData.ts - Data  
 hook

 Modified Files (2 files)

 1. src/nav/SupervisorNavigator.tsx → Rename to
 SupervisorTabNavigator.tsx - Reduce to 5 tabs
 2. src/nav/RootNavigator.tsx - Update supervisor entry point  

 Reference Files (No changes)

 - src/supervisor/context/SiteContext.tsx - Verify
 compatibility
 - src/logistics/LogisticsDashboardScreen.tsx - Dashboard      
 pattern reference
 - src/commercial/CommercialDashboardScreen.tsx - Alerts       
 pattern reference

 ---
 Risk Mitigation

 Risk 1: Navigation State Loss
 - Mitigation: SiteProvider wraps drawer (not individual       
 screens)
 - Test: Verify selectedSiteId persists across all navigation  

 Risk 2: Drawer Discoverability
 - Mitigation: "More" tab with menu icon clearly indicates     
 drawer
 - Consider: First-launch tutorial showing drawer swipe        
 gesture

 Risk 3: Performance Impact
 - Mitigation: Dashboard uses Promise.all for parallel data    
 fetching
 - Monitor: Dashboard load time should be <2s

 Risk 4: Breaking Existing Flows
 - Mitigation: All screen names remain the same (except new    
 Dashboard)
 - Test: Deep linking and navigation.navigate() calls

 ---
 Success Criteria

 - ✅ Dashboard screen displays 4 KPIs correctly
 - ✅ Navigation reduced from 7 to 5 bottom tabs
 - ✅ Drawer contains 4 secondary screens
 - ✅ All screens remain accessible
 - ✅ No navigation state loss
 - ✅ Performance maintained (no lag)
 - ✅ 100% backwards compatibility
 - ✅ User testing shows improved UX

 ---
 Implementation Order

 Day 1-2: Setup + Dependencies
 - Install packages
 - Configure Babel
 - Create folder structure

 Day 3-5: Dashboard Implementation
 - Build MetricCard component
 - Build DashboardScreen layout
 - Implement useDashboardData hook
 - Add loading skeletons

 Day 6-8: Navigation Restructure
 - Create SupervisorDrawerNavigator
 - Refactor SupervisorTabNavigator (5 tabs)
 - Update RootNavigator
 - Wire "More" tab to drawer

 Day 9: Error Handling & Polish
 - Add ErrorBoundary wrappers
 - Test all navigation flows
 - Fix any issues

 Day 10: Testing & Refinement
 - Run full test suite
 - User acceptance testing
 - Performance profiling
 - Final adjustments

 ---
 Next Steps After Completion

 1. Update documentation (ARCHITECTURE_UNIFIED.md)
 2. Create Phase 3 Task 3.1 completion summary
 3. User testing with real supervisors
 4. Gather feedback for iterations
 5. Proceed to Task 3.2 (Accessibility Improvements)

 ---
 Estimated Total: 17-23 hours across 10 implementation days    
 Complexity: Medium-High (Navigation restructure + new screen) 
 User Impact: High (Primary daily interaction point)
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
