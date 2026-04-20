import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconsName; iconFocused: IoniconsName }[] = [
  { name: 'dashboard',        label: 'Dashboard', icon: 'grid-outline',                iconFocused: 'grid'                },
  { name: 'listings/index',   label: 'Listings',  icon: 'business-outline',            iconFocused: 'business'            },
  { name: 'tenancies/index',  label: 'Tenants',   icon: 'people-outline',              iconFocused: 'people'              },
  { name: 'payments/index',   label: 'Payments',  icon: 'wallet-outline',              iconFocused: 'wallet'              },
  { name: 'complaints/index', label: 'Support',   icon: 'chatbubble-ellipses-outline', iconFocused: 'chatbubble-ellipses' },
];

function FloatingTabBar({ state, navigation }: any) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();

  return (
    <View style={[
      styles.bar,
      {
        bottom:          insets.bottom + 10,
        backgroundColor: theme.tabBarBg,
        borderColor:     theme.border,
        shadowColor:     '#000',
      }
    ]}>
      {state.routes.filter((route: any) => TABS.some(t => t.name === route.name)).map((route: any) => {
        const index   = state.routes.indexOf(route);
        const focused = state.index === index;
        const tab     = TABS.find(t => t.name === route.name)!;

        return (
          <Pressable
            key={route.key}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            style={styles.tab}
            hitSlop={8}
          >
            <View style={[styles.pill, focused && { backgroundColor: theme.tabActive + '1E' }]}>
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={focused ? theme.tabActive : theme.tabInactive}
              />
            </View>
            <Text style={{ fontSize: 10, fontWeight: focused ? '600' : '400', color: focused ? theme.tabActive : theme.tabInactive }} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function LandlordLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown:  false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      {TABS.map(t => <Tabs.Screen key={t.name} name={t.name} />)}

      {/* Detail / flow screens — hidden from tab bar */}
      <Tabs.Screen name="listings/create"     options={{ href: null }} />
      <Tabs.Screen name="listings/[id]"       options={{ href: null }} />
      <Tabs.Screen name="complaints/[id]"     options={{ href: null }} />
      <Tabs.Screen name="applications"          options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position:      'absolute',
    left:          12,
    right:         12,
    height:        64,
    borderRadius:  20,
    borderWidth:   1,
    flexDirection: 'row',
    alignItems:    'center',
    elevation:     20,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius:  16,
  },
  tab:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
