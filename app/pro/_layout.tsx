import { Stack } from "expo-router";

export default function ProRoutesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="products" />
    </Stack>
  );
}
