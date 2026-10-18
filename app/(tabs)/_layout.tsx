import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Timer, Calendar, Receipt, Briefcase, BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const { isManager } = useAuth();
  const router = useRouter();

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
          fontSize: 10,
          fontWeight: '700',
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
        headerRight: isManager
          ? () => (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                style={{ paddingRight: 16 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Settings color={colors.textDim} size={19} />
              </TouchableOpacity>
            )
          : undefined,
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
          tabBarIcon: ({ color }) => <Timer color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Timesheet',
          headerTitle: 'Timesheet Matrix',
          tabBarIcon: ({ color }) => <Calendar color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          headerTitle: 'Expenses & Receipts',
          tabBarIcon: ({ color }) => <Receipt color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerTitle: 'Projects & Budgets',
          tabBarIcon: ({ color }) => <Briefcase color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: 'Manager',
          headerTitle: 'Executive Manager Suite',
          href: isManager ? undefined : null,
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings & Workspace',
          href: isManager ? null : undefined,
          tabBarIcon: ({ color }) => <Settings color={color} size={20} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
