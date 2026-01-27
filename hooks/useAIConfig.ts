import { useState, useEffect } from 'react';
import { AIConfig, subscribeToAIConfig, isAIAvailable } from '@/services/ai-config';

const DEFAULT_CONFIG: AIConfig = {
  enabled: true,
  enabledCategories: {
    alimentation: true,
    comportement: true,
    prevention: true,
    hygiene: true,
    activite: true,
    autre: true,
  },
  globalBanner: {
    enabled: false,
    message: '',
    type: 'info',
  },
  maintenanceMode: false,
  updatedAt: new Date(),
  updatedBy: 'system',
};

export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[useAIConfig] Subscribing to AI config changes');
    
    const unsubscribe = subscribeToAIConfig((newConfig) => {
      console.log('[useAIConfig] Config updated:', {
        enabled: newConfig.enabled,
        maintenanceMode: newConfig.maintenanceMode,
        bannerEnabled: newConfig.globalBanner.enabled,
      });
      setConfig(newConfig);
      setIsLoading(false);
    });

    return () => {
      console.log('[useAIConfig] Unsubscribing from AI config');
      unsubscribe();
    };
  }, []);

  const isAvailable = isAIAvailable(config);
  
  const disabledMessage = !config.enabled 
    ? 'Le service de conseils est temporairement indisponible.'
    : config.maintenanceMode 
      ? 'Le service est en maintenance. Merci de réessayer plus tard.'
      : null;

  return {
    config,
    isLoading,
    isAvailable,
    disabledMessage,
    globalBanner: config.globalBanner,
  };
}
