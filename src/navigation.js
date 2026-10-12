import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {onAuthChanged} from './api';
import {colors} from './theme';
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import About from './screens/About';
import Lists from './screens/Lists';
import Tasks from './screens/Tasks';

const Stack = createStackNavigator();

// The navigator is driven by auth state: signed-out users get the onboarding
// stack, signed-in users get the app. No manual navigate() after login/logout.
export default function Navigation() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthChanged(setUser), []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none">
        {user ? (
          <>
            <Stack.Screen name="Lists">
              {props => <Lists {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Tasks">
              {props => <Tasks {...props} user={user} />}
            </Stack.Screen>
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
