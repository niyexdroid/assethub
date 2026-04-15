import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type NavItem = {
  key:          string;
  label:        string;
  icon:         IoniconsName;
  iconFocused:  IoniconsName;
};

interface Props {
  items:        NavItem[];
  activeKey:    string;
  onPress:      (key: string) => void;
}

export const NAV_BAR_HEIGHT = 64;

export function NavBar({ items, activeKey, onPress }: Props) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        bottom:           insets.bottom + 12,
        backgroundColor:  theme.tabBarBg,
        borderColor:      theme.border,
        shadowColor:      theme.mode === 'dark' ? '#000' : '#000',
      }
    ]}>
      {items.map(item => {
        const focused = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onPress(item.key)}
            style={styles.tab}
            hitSlop={6}
          >
            <View style={[
              styles.pill,
              focused && { backgroundColor: theme.tabActive + '1E' }
            ]}>
              <Ionicons
                name={focused ? item.iconFocused : item.icon}
                size={22}
                color={focused ? theme.tabActive : theme.tabInactive}
              />
            </View>
            <Text style={[
              typography.caption,
              {
                color:      focused ? theme.tabActive : theme.tabInactive,
                fontWeight: focused ? '600' : '400',
                fontSize:   10,
                marginTop:  2,
              }
            ]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:     'absolute',
    left:         16,
    right:        16,
    height:       NAV_BAR_HEIGHT,
    borderRadius: 22,
    borderWidth:  1,
    flexDirection: 'row',
    alignItems:   'center',
    elevation:    24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  pill: {
    width:          46,
    height:         30,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
