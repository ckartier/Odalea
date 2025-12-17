import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
    </Stack>
  );
}
