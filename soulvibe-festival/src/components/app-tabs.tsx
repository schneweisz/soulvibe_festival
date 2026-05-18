import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SV } from '@/constants/theme';

interface TabIconProps {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

function TabIcon({ name, color, size, focused }: TabIconProps) {
  return (
    <View style={styles.iconWrap}>
      {focused && <View style={styles.activeDot} />}
      <MaterialIcons name={name as any} size={size} color={color} />
    </View>
  );
}

const HIDDEN: any = {
  tabBarButton: () => null,
  tabBarStyle: { display: 'none' },
};

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: SV.surfaceContainerLowest,
          borderTopColor: SV.outlineVariant,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 68,
          paddingBottom: Platform.OS === 'ios' ? 22 : 10,
          paddingTop: 6,
          elevation: 24,
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
        tabBarIconStyle: { marginBottom: 0 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lineup"
        options={{
          title: 'LINEUP',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="event-note" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="map" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="gastro"
        options={{
          title: 'GASTRO',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="fastfood" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'INFO',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="info" color={color} size={size} focused={focused} />
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

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeDot: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: SV.primaryContainer,
    shadowColor: SV.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
});
