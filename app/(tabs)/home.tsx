import React from 'react';
import { Redirect } from 'expo-router';

export default function HomeTabRedirect() {
  return <Redirect href="/matching/discover" />;
}
