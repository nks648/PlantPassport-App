import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Leaf, User, Users, Trophy } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.03,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500' as const,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          tabBarIcon: ({ color, focused }) => (
            <Leaf size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Users size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color, focused }) => (
            <Trophy size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
    </Tabs>
  );
}
