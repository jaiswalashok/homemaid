import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ListChecks,
  UtensilsCrossed,
  Receipt,
  ShoppingCart,
  Settings,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import TasksScreen from '../screens/TasksScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import GroceryScreen from '../screens/GroceryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { COLORS } from '../config/theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: t('tasks'),
          tabBarIcon: ({ color, size }) => <ListChecks size={size} color={color} />,
          tabBarActiveTintColor: COLORS.tasks,
        }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          tabBarLabel: t('recipes'),
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
          tabBarActiveTintColor: COLORS.recipes,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: t('expenses'),
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
          tabBarActiveTintColor: COLORS.expenses,
        }}
      />
      <Tab.Screen
        name="Grocery"
        component={GroceryScreen}
        options={{
          tabBarLabel: t('grocery'),
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
          tabBarActiveTintColor: COLORS.grocery,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
