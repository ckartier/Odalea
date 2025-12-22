import { Stack } from 'expo-router';

export default function MatchingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="discover" />
      <Stack.Screen name="list" />
    </Stack>
  );
}
