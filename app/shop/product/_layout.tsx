import { Stack } from "expo-router";

export default function ProductLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
