import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SV } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: SV.surfaceContainerLowest,
          borderTopColor: SV.outlineVariant,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 20,
        },
        tabBarActiveTintColor: SV.primaryContainer,
        tabBarInactiveTintColor: SV.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lineup"
        options={{
          title: 'LINEUP',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-note" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gastro"
        options={{
          title: 'GASTRO',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="fastfood" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'INFO',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info" size={size + 2} color={color} />
          ),
        }}
      />
      {/* Stack-like screens: hidden from tab bar, tab bar also hidden when on these screens */}
      <Tabs.Screen
        name="profile"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="cart"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="explore"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
