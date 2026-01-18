import React from 'react';
import { Redirect } from 'expo-router';

export default function ChallengesTabRedirect() {
  return <Redirect href="/matching/list" />;
}
