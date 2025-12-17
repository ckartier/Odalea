import { Stack } from "expo-router";

export default function ChallengesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
