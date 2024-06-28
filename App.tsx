import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import Recorder from './Recorder';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Recorder />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
