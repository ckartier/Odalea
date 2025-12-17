import { Stack } from "expo-router";

export default function CatSitterLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
