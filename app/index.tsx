import { Redirect } from 'expo-router';

/**
 * Entry point — redirects to onboarding.
 * In a real app, this would check if onboarding is completed.
 */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
