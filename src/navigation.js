import React, { useEffect, useReducer, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthChanged, onProfileUpdated } from './api';
import { UserContext } from './auth';
import { colors } from './theme';
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import About from './screens/About';
import Lists from './screens/Lists';
import Tasks from './screens/Tasks';

const Stack = createNativeStackNavigator();
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
};

// The navigator is driven by auth state: signed-out users get the onboarding
// stack, signed-in users get the app. No manual navigate() after login/logout.
export default function Navigation() {
  const [user, setUser] = useState(undefined);
  const [, refresh] = useReducer(n => n + 1, 0);

  useEffect(() => onAuthChanged(setUser), []);
  useEffect(() => onProfileUpdated(refresh), []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          {user ? (
            <>
              <Stack.Screen name="Lists" component={Lists} />
              <Stack.Screen name="Tasks" component={Tasks} />
            </>
          ) : (
            <>
              <Stack.Screen name="Welcome" component={Welcome} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
            </>
          )}
          <Stack.Screen name="About" component={About} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
