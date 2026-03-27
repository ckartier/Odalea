import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { AIQuestionCategory } from './ai-logging';

export interface AIConfig {
  enabled: boolean;
  enabledCategories: Record<AIQuestionCategory, boolean>;
  globalBanner: {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'error';
  };
  maintenanceMode: boolean;
  updatedAt: Date;
  updatedBy: string;
}

const AI_CONFIG_DOC = 'ai_assistant';
const CONFIG_COLLECTION = 'app_config';

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

export async function getAIConfig(): Promise<AIConfig> {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, AI_CONFIG_DOC);
    const snapshot = await getDoc(configRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log('[AIConfig] Loaded config:', data);
      return {
        ...DEFAULT_CONFIG,
        ...data,
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as AIConfig;
    }

    console.log('[AIConfig] No config found, using defaults');
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('[AIConfig] Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function updateAIConfig(
  updates: Partial<AIConfig>,
  adminUserId: string
): Promise<boolean> {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, AI_CONFIG_DOC);
    const currentConfig = await getAIConfig();

    const newConfig: AIConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: new Date(),
      updatedBy: adminUserId,
    };

    await setDoc(configRef, newConfig);
    console.log('[AIConfig] Config updated:', newConfig);
    return true;
  } catch (error) {
    console.error('[AIConfig] Error updating config:', error);
    return false;
  }
}

export async function toggleAIEnabled(
  enabled: boolean,
  adminUserId: string
): Promise<boolean> {
  return updateAIConfig({ enabled }, adminUserId);
}

export async function toggleCategoryEnabled(
  category: AIQuestionCategory,
  enabled: boolean,
  adminUserId: string
): Promise<boolean> {
  const currentConfig = await getAIConfig();
  return updateAIConfig(
    {
      enabledCategories: {
        ...currentConfig.enabledCategories,
        [category]: enabled,
      },
    },
    adminUserId
  );
}

export async function setGlobalBanner(
  banner: AIConfig['globalBanner'],
  adminUserId: string
): Promise<boolean> {
  return updateAIConfig({ globalBanner: banner }, adminUserId);
}

export async function toggleMaintenanceMode(
  enabled: boolean,
  adminUserId: string
): Promise<boolean> {
  return updateAIConfig({ maintenanceMode: enabled }, adminUserId);
}

export function subscribeToAIConfig(
  callback: (config: AIConfig) => void
): Unsubscribe {
  const configRef = doc(db, CONFIG_COLLECTION, AI_CONFIG_DOC);

  return onSnapshot(
    configRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...DEFAULT_CONFIG,
          ...data,
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as AIConfig);
      } else {
        callback(DEFAULT_CONFIG);
      }
    },
    (error) => {
      console.error('[AIConfig] Subscription error:', error);
      callback(DEFAULT_CONFIG);
    }
  );
}

export function isCategoryEnabled(
  config: AIConfig,
  category: AIQuestionCategory
): boolean {
  return config.enabled && config.enabledCategories[category] !== false;
}

export function isAIAvailable(config: AIConfig): boolean {
  return config.enabled && !config.maintenanceMode;
}
