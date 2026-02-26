/**
 * TemplatesStackNavigator
 *
 * Stack navigator for the Activity Templates feature.
 * TemplatesList → TemplateDetail
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TemplatesScreen from './TemplatesScreen';
import TemplateDetailScreen from './TemplateDetailScreen';
import TemplateModuleModel from '../../../models/TemplateModuleModel';

export type TemplatesStackParamList = {
  TemplatesList: undefined;
  TemplateDetail: { template: { id: string; name: string; category: string } };
};

const Stack = createNativeStackNavigator<TemplatesStackParamList>();

const TemplatesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TemplatesList" component={TemplatesScreen} />
      <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
    </Stack.Navigator>
  );
};

export default TemplatesStackNavigator;
