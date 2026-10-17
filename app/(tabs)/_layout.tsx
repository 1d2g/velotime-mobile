import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Timer, Calendar, Briefcase, Settings } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
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
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
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
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 2, color: colors.text }}>
                VELO<Text style={{ color: colors.primary }}>TIME</Text>
              </Text>
            </View>
          ),
          tabBarIcon: ({ color }) => <Timer color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          headerTitle: 'Weekly Timesheet',
          tabBarIcon: ({ color }) => <Calendar color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerTitle: 'Projects & Budgets',
          tabBarIcon: ({ color }) => <Briefcase color={color} size={22} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings & Theme',
          tabBarIcon: ({ color }) => <Settings color={color} size={22} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
