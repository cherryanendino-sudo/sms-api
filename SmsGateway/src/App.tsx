import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {AppNavigator} from './navigation/AppNavigator';
import {useSettingsStore} from './store/useSettingsStore';

const App: React.FC = () => {
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121220" />
      <AppNavigator />
    </>
  );
};

export default App;
