import { Redirect } from 'expo-router';

// Legacy route — redirects to the Lineup screen
export default function ExploreRedirect() {
  return <Redirect href="/lineup" />;
}
