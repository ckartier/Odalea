import { Stack } from "expo-router";

export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="cart" />
      <Stack.Screen name="order-confirmation" />
      <Stack.Screen name="product" />
    </Stack>
  );
}
