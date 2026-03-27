import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEY = 'odalea:onboarding:v1';

interface OnboardingState {
  hasCompleted: boolean;
  preferredIntent: 'map' | 'community' | 'lostFound' | 'pros' | 'catSitter' | null;
}

const defaultState: OnboardingState = {
  hasCompleted: false,
  preferredIntent: null,
};

export const [OnboardingContext, useOnboarding] = createContextHook(() => {
  const qc = useQueryClient();
  const [state, setState] = useState<OnboardingState>(defaultState);

  const loadQuery = useQuery({
    queryKey: ['onboardingState'],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return defaultState;
      try {
        const parsed = JSON.parse(raw) as Partial<OnboardingState>;
        return {
          hasCompleted: Boolean(parsed.hasCompleted),
          preferredIntent: (parsed.preferredIntent ?? null) as OnboardingState['preferredIntent'],
        } satisfies OnboardingState;
      } catch {
        return defaultState;
      }
    },
  });

  useEffect(() => {
    if (loadQuery.data) setState(loadQuery.data);
  }, [loadQuery.data]);

  const persistMutation = useMutation({
    mutationFn: async (next: OnboardingState) => {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    },
    onSuccess: (next) => {
      setState(next);
      qc.setQueryData(['onboardingState'], next);
    },
  });

  const setPreferredIntent = (intent: OnboardingState['preferredIntent']) => {
    const next: OnboardingState = { ...state, preferredIntent: intent };
    persistMutation.mutate(next);
  };

  const complete = () => {
    const next: OnboardingState = { ...state, hasCompleted: true };
    persistMutation.mutate(next);
  };

  const reset = () => {
    persistMutation.mutate(defaultState);
  };

  const isReady = useMemo(() => !loadQuery.isLoading, [loadQuery.isLoading]);

  return {
    ...state,
    isReady,
    isLoading: loadQuery.isLoading || persistMutation.isPending,
    setPreferredIntent,
    complete,
    reset,
  };
});
