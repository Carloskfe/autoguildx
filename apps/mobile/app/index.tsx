import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
      <Text style={{ color: '#f97316', fontSize: 28, fontWeight: '900' }}>AutoGuildX</Text>
      <Text style={{ color: '#fff', fontSize: 16, marginTop: 8 }}>Routing works ✓</Text>
    </View>
  );
}
