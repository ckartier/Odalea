import { Stack } from "expo-router";

export default function LostFoundLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="report" />
    </Stack>
  );
}
