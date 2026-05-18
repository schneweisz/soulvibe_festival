import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SV } from '@/constants/theme';

// On web, use the same standard expo-router Tabs as native.
// This avoids expo-router/ui's side-panel layout that rendered navigation on the left.
export default function AppTabs() {
  const HIDDEN: any = {
    tabBarButton: () => null,
    tabBarStyle: { display: 'none' },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: SV.surfaceContainerLowest,
          borderTopColor: SV.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: SV.primaryContainer,
        tabBarInactiveTintColor: SV.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lineup"
        options={{
          title: 'LINEUP',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gastro"
        options={{
          title: 'GASTRO',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="fastfood" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'INFO',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={HIDDEN} />
      <Tabs.Screen name="cart" options={HIDDEN} />
      <Tabs.Screen name="wallet" options={HIDDEN} />
      <Tabs.Screen name="explore" options={HIDDEN} />
    </Tabs>
  );
}
