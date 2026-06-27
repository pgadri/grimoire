import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography, Spacing } from '../../constants/theme'
import { View, StyleSheet } from 'react-native'

type IconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrapper}>
      {focused && <View style={styles.indicator} />}
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { ...Typography.tabLabel, marginBottom: 4 },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Repo',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'git-branch' : 'git-branch-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'flash' : 'flash-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Expert Help',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingTop: Spacing.sm,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.tabActive,
  },
})
