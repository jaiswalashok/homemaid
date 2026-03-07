import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="✅" label="Tasks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🍳" label="Recipes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🧾" label="Expenses" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" label="Grocery" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 70,
    paddingBottom: 4,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: { alignItems: 'center', gap: 2, paddingHorizontal: 4, flex: 1 },
  tabItemFocused: {},
  tabIcon: { fontSize: 20, color: '#9CA3AF' },
  tabIconFocused: { color: '#4F46E5' },
  tabLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  tabLabelFocused: { color: '#4F46E5', fontWeight: '700' },
});
