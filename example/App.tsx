import { StyleSheet, Text, View } from 'react-native';

import * as ExpoWebServer from 'expo-web-server';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{ExpoWebServer.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
