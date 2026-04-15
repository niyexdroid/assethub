import { View, ActivityIndicator } from 'react-native';

// Root index — _layout.tsx handles auth-based redirection.
// This screen shows briefly while fonts + auth load.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#12A376" />
    </View>
  );
}
