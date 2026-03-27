import { Stack } from "expo-router";

export default function PetLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
