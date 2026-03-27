import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AIQuestionCategory = 'alimentation' | 'comportement' | 'prevention' | 'hygiene' | 'activite' | 'autre';

export interface AILogEntry {
  userId: string;
  petId: string;
  species: string;
  category: AIQuestionCategory;
  riskFlag: boolean;
  timestamp: Timestamp;
  quotaType: 'gratuit' | 'premium';
  responseType: 'normal' | 'emergency' | 'medical_blocked' | 'error';
  detectedKeywords?: string[];
}

export interface AILogAnalytics {
  totalQuestions: number;
  categoryBreakdown: Record<AIQuestionCategory, number>;
  riskAlertCount: number;
  quotaBreakdown: { gratuit: number; premium: number };
  responseTypeBreakdown: Record<string, number>;
}

const CATEGORY_KEYWORDS: Record<AIQuestionCategory, string[]> = {
  alimentation: [
    'manger', 'nourriture', 'croquettes', 'alimentation', 'régime', 'repas',
    'boire', 'eau', 'gamelle', 'friandise', 'poids', 'maigrir', 'grossir',
    'riz', 'viande', 'légume', 'fruit', 'lait', 'chocolat', 'os', 'pâtée',
    'appétit', 'digestion', 'allergie alimentaire', 'portion', 'quantité',
    'nourrir', 'donner à manger', 'vitamines', 'complément', 'bio',
  ],
  comportement: [
    'comportement', 'agressif', 'peur', 'anxiété', 'stress', 'aboie', 'miaule',
    'mordre', 'griffer', 'fugue', 'destruction', 'propreté', 'éducation',
    'dressage', 'obéissance', 'rappel', 'laisse', 'tire', 'saute', 'joue',
    'socialisation', 'dominant', 'soumis', 'jaloux', 'territorial',
    'séparation', 'seul', 'nuit', 'dort', 'dort pas', 'nerveux', 'calme',
    'agressivité', 'mord', 'attaque', 'grogne', 'feule', 'cache',
  ],
  prevention: [
    'vaccin', 'vaccination', 'vermifuge', 'vermifuger', 'antiparasitaire',
    'puce', 'puces', 'tique', 'tiques', 'vers', 'parasites', 'prévention',
    'rappel', 'carnet', 'stérilisation', 'castration', 'identification',
    'puce électronique', 'tatouage', 'assurance', 'vétérinaire',
    'bilan', 'check-up', 'dépistage', 'rage', 'typhus', 'coryza', 'leucose',
  ],
  hygiene: [
    'toilettage', 'brossage', 'pelage', 'poil', 'poils', 'mue', 'bain',
    'shampoing', 'oreille', 'oreilles', 'dent', 'dents', 'griffe', 'griffes',
    'coupe', 'couper', 'nettoyer', 'nettoyage', 'odeur', 'sale', 'propre',
    'yeux', 'larmes', 'litière', 'hygiène', 'entretien', 'soins',
  ],
  activite: [
    'exercice', 'promenade', 'balade', 'jouer', 'jeu', 'jouet', 'activité',
    'sport', 'courir', 'nager', 'marcher', 'fatigue', 'énergie', 'repos',
    'dormir', 'sommeil', 'parc', 'jardin', 'extérieur', 'intérieur',
    'stimulation', 'ennui', 'occupation', 'agility', 'canicross',
  ],
  autre: [],
};

export function detectQuestionCategory(text: string): AIQuestionCategory {
  const lowerText = text.toLowerCase();
  const categoryScores: Record<AIQuestionCategory, number> = {
    alimentation: 0,
    comportement: 0,
    prevention: 0,
    hygiene: 0,
    activite: 0,
    autre: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'autre') continue;
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        categoryScores[category as AIQuestionCategory] += 1;
      }
    }
  }

  let maxCategory: AIQuestionCategory = 'autre';
  let maxScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (category !== 'autre' && score > maxScore) {
      maxScore = score;
      maxCategory = category as AIQuestionCategory;
    }
  }

  console.log('[AILogging] Category detection:', { text: text.substring(0, 50), categoryScores, detected: maxCategory });

  return maxCategory;
}

export async function logAIInteraction(params: {
  userId: string;
  petId: string;
  species: string;
  questionText: string;
  isPremium: boolean;
  riskFlag: boolean;
  responseType: 'normal' | 'emergency' | 'medical_blocked' | 'error';
  detectedKeywords?: string[];
}): Promise<string | null> {
  const { userId, petId, species, questionText, isPremium, riskFlag, responseType, detectedKeywords } = params;

  try {
    const category = detectQuestionCategory(questionText);

    const logEntry: AILogEntry = {
      userId,
      petId,
      species: species.toLowerCase(),
      category,
      riskFlag,
      timestamp: Timestamp.now(),
      quotaType: isPremium ? 'premium' : 'gratuit',
      responseType,
      ...(detectedKeywords && detectedKeywords.length > 0 && { detectedKeywords }),
    };

    const docRef = await addDoc(collection(db, 'ai_logs'), logEntry);
    
    console.log('[AILogging] Logged AI interaction:', {
      logId: docRef.id,
      category,
      riskFlag,
      quotaType: logEntry.quotaType,
      responseType,
    });

    return docRef.id;
  } catch (error) {
    console.error('[AILogging] Error logging AI interaction:', error);
    return null;
  }
}

export async function getAIAnalytics(options?: {
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
}): Promise<AILogAnalytics | null> {
  try {
    const logsRef = collection(db, 'ai_logs');
    let q = query(logsRef, orderBy('timestamp', 'desc'));

    if (options?.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
    }
    if (options?.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    
    const analytics: AILogAnalytics = {
      totalQuestions: 0,
      categoryBreakdown: {
        alimentation: 0,
        comportement: 0,
        prevention: 0,
        hygiene: 0,
        activite: 0,
        autre: 0,
      },
      riskAlertCount: 0,
      quotaBreakdown: { gratuit: 0, premium: 0 },
      responseTypeBreakdown: {},
    };

    snapshot.forEach((doc) => {
      const data = doc.data() as AILogEntry;
      analytics.totalQuestions++;
      
      if (data.category) {
        analytics.categoryBreakdown[data.category]++;
      }
      
      if (data.riskFlag) {
        analytics.riskAlertCount++;
      }
      
      if (data.quotaType) {
        analytics.quotaBreakdown[data.quotaType]++;
      }
      
      if (data.responseType) {
        analytics.responseTypeBreakdown[data.responseType] = 
          (analytics.responseTypeBreakdown[data.responseType] || 0) + 1;
      }
    });

    console.log('[AILogging] Analytics generated:', analytics);

    return analytics;
  } catch (error) {
    console.error('[AILogging] Error getting analytics:', error);
    return null;
  }
}

export async function getRecentRiskAlerts(limitCount: number = 50): Promise<AILogEntry[]> {
  try {
    const logsRef = collection(db, 'ai_logs');
    const q = query(
      logsRef,
      where('riskFlag', '==', true),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const alerts: AILogEntry[] = [];

    snapshot.forEach((doc) => {
      alerts.push(doc.data() as AILogEntry);
    });

    console.log('[AILogging] Retrieved risk alerts:', alerts.length);

    return alerts;
  } catch (error) {
    console.error('[AILogging] Error getting risk alerts:', error);
    return [];
  }
}

export async function getCategoryStats(): Promise<Record<AIQuestionCategory, number> | null> {
  try {
    const analytics = await getAIAnalytics({ limitCount: 1000 });
    return analytics?.categoryBreakdown || null;
  } catch (error) {
    console.error('[AILogging] Error getting category stats:', error);
    return null;
  }
}
