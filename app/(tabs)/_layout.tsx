import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Timer, Calendar, Briefcase, Settings } from 'lucide-react-native';
import { Colors } from '@/src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderSubtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.bg,
          borderBottomColor: Colors.borderSubtle,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          headerTitle: 'VeloTime',
          tabBarIcon: ({ color, size }) => <Timer color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          headerTitle: 'Weekly Timesheet',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerTitle: 'Projects & Budgets',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings & Workspace',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={22} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
