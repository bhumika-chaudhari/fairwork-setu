import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useProfile } from '../context/ProfileContext';
import { Colors } from '../constants/theme';

export default function Index() {
  const { ready, onboardingComplete } = useProfile();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
