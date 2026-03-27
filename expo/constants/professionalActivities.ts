import { ProfessionalActivityType } from '@/types';

export type FieldValue = string | string[];

export type FieldInputType = 'text' | 'number' | 'email' | 'phone' | 'url' | 'multiselect';

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export interface ActivityFieldConfig {
  key: string;
  label: string;
  placeholder: string;
  inputType: FieldInputType;
  multiline?: boolean;
  options?: string[];
  validation: FieldValidation;
}

export interface ActivitySectionConfig {
  key: string;
  title: string;
  subtitle?: string;
  fields: ActivityFieldConfig[];
}

export interface DocumentRequirement {
  key: string;
  label: string;
  description: string;
  mandatory: boolean;
}

export interface ActivityConfig {
  id: ProfessionalActivityType;
  label: string;
  chipLabel: string;
  description: string;
  sections: ActivitySectionConfig[];
  documents: DocumentRequirement[];
}

const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

export const PROFESSIONAL_ACTIVITY_CONFIG: Record<ProfessionalActivityType, ActivityConfig> = {
  vet: {
    id: 'vet',
    label: 'Vétérinaire',
    chipLabel: 'Vétérinaire',
    description: 'Profils vérifiés avec RPPS ou numéro ordinal et services médicaux spécialisés.',
    sections: [
      {
        key: 'identity',
        title: 'Identité professionnelle',
        subtitle: 'Présentez votre clinique et vos informations officielles.',
        fields: [
          {
            key: 'fullName',
            label: 'Nom complet',
            placeholder: 'Dr Jeanne Martin',
            inputType: 'text',
            validation: { required: true, minLength: 4 },
          },
          {
            key: 'ordinalNumber',
            label: 'Numéro RPPS / Ordinal',
            placeholder: '10101010101',
            inputType: 'text',
            validation: {
              required: true,
              pattern: /^[0-9]{11}$/,
              patternMessage: 'RPPS attendu : 11 chiffres',
            },
          },
          {
            key: 'clinicName',
            label: 'Nom de la clinique',
            placeholder: 'Clinique Montparnasse',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'clinicEmail',
            label: 'Email professionnel',
            placeholder: 'contact@clinique.fr',
            inputType: 'email',
            validation: {
              required: true,
              pattern: EMAIL_PATTERN,
              patternMessage: 'Email professionnel invalide',
            },
          },
          {
            key: 'clinicPhone',
            label: 'Téléphone de la clinique',
            placeholder: '+33143070106',
            inputType: 'phone',
            validation: {
              required: true,
              pattern: PHONE_PATTERN,
              patternMessage: 'Téléphone au format international',
            },
          },
          {
            key: 'accreditationDocumentUrl',
            label: 'Justificatif d’agrément',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
        ],
      },
      {
        key: 'expertise',
        title: 'Expertises & services',
        subtitle: 'Spécialités proposées au sein de votre clinique.',
        fields: [
          {
            key: 'specialties',
            label: 'Spécialités',
            placeholder: 'Sélectionnez vos spécialités',
            inputType: 'multiselect',
            options: ['NAC', 'Chirurgie', 'Dermatologie', 'Imagerie', 'Urgences', 'Comportement', 'Dentisterie'],
            validation: { required: true, minLength: 1 },
          },
          {
            key: 'services',
            label: 'Services',
            placeholder: 'Sélectionnez vos services',
            inputType: 'multiselect',
            options: ['Consultation', 'Vaccins', 'Urgence', 'Chirurgie', 'Visite à domicile', 'Téléconsultation'],
            validation: { required: true, minLength: 1 },
          },
        ],
      },
    ],
    documents: [
      {
        key: 'identity',
        label: 'Justificatif d’identité professionnelle',
        description: 'RPPS ou attestation ordinale récente.',
        mandatory: true,
      },
      {
        key: 'accreditation',
        label: 'Autorisation d’exercer',
        description: 'Certificat ou agrément valable.',
        mandatory: true,
      },
    ],
  },
  shelter: {
    id: 'shelter',
    label: 'Refuge',
    chipLabel: 'Refuge',
    description: 'Structures agréées pour l’accueil et la protection animale.',
    sections: [
      {
        key: 'structure',
        title: 'Informations structure',
        subtitle: 'Cadre légal et agréments.',
        fields: [
          {
            key: 'structureName',
            label: 'Nom du refuge',
            placeholder: 'Refuge de la Seine',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'siren',
            label: 'Numéro SIREN',
            placeholder: '123456789',
            inputType: 'number',
            validation: {
              required: true,
              pattern: /^[0-9]{9}$/,
              patternMessage: 'SIREN attendu : 9 chiffres',
            },
          },
          {
            key: 'prefecturalApproval',
            label: 'Agrément préfectoral',
            placeholder: 'ARR-75-2024-001',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'shelterAddress',
            label: 'Adresse du refuge',
            placeholder: '12 rue des Lilas, 75012 Paris',
            inputType: 'text',
            validation: { required: true },
          },
        ],
      },
      {
        key: 'operations',
        title: 'Fonctionnement',
        subtitle: 'Capacités d’accueil et zone couverte.',
        fields: [
          {
            key: 'capacity',
            label: 'Capacité d’accueil',
            placeholder: 'Ex. 80 animaux',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'coverageArea',
            label: 'Périmètre géographique',
            placeholder: 'Ile-de-France, rayonnement 50km',
            inputType: 'text',
            multiline: true,
            validation: { required: true, minLength: 6 },
          },
        ],
      },
      {
        key: 'contact',
        title: 'Contact référent',
        subtitle: 'Personne en charge et justificatifs.',
        fields: [
          {
            key: 'referentName',
            label: 'Nom du référent',
            placeholder: 'Camille Dupont',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'referentPhone',
            label: 'Téléphone du référent',
            placeholder: '+33143070106',
            inputType: 'phone',
            validation: {
              required: true,
              pattern: PHONE_PATTERN,
              patternMessage: 'Téléphone au format international',
            },
          },
          {
            key: 'justificationDocumentUrl',
            label: 'Justificatif officiel',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
        ],
      },
    ],
    documents: [
      {
        key: 'prefecture',
        label: 'Arrêté préfectoral',
        description: 'Document prouvant l’autorisation d’ouverture.',
        mandatory: true,
      },
      {
        key: 'sirenProof',
        label: 'Justificatif SIREN',
        description: 'Extrait Kbis ou équivalent.',
        mandatory: true,
      },
    ],
  },
  breeder: {
    id: 'breeder',
    label: 'Éleveur',
    chipLabel: 'Éleveur',
    description: 'Affixes déclarés, numéros LOF/ICC et certificats sanitaires.',
    sections: [
      {
        key: 'identity',
        title: 'Identité d’élevage',
        subtitle: 'Affixe et enregistrement officiel.',
        fields: [
          {
            key: 'affix',
            label: 'Affixe',
            placeholder: 'Des Jardins Parisiens',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'breeds',
            label: 'Races élevées',
            placeholder: 'Sélectionnez vos races',
            inputType: 'multiselect',
            options: ['British Shorthair', 'Sacré de Birmanie', 'Maine Coon', 'Bengal', 'Sphynx', 'Persan'],
            validation: { required: true },
          },
          {
            key: 'breederNumber',
            label: 'Numéro LOF / ICC',
            placeholder: 'LOF-123456',
            inputType: 'text',
            validation: {
              required: true,
              minLength: 6,
            },
          },
        ],
      },
      {
        key: 'compliance',
        title: 'Conformité',
        subtitle: 'Documents sanitaires et conditions.',
        fields: [
          {
            key: 'healthCertificatesUrl',
            label: 'Certificats sanitaires',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
          {
            key: 'transferConditions',
            label: 'Conditions de cession',
            placeholder: 'Décrivez les modalités',
            inputType: 'text',
            multiline: true,
            validation: { required: true, minLength: 10 },
          },
          {
            key: 'farmWebsite',
            label: 'Site de l’élevage',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: false,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
          {
            key: 'activityProofUrl',
            label: 'Justificatif d’activité',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
        ],
      },
    ],
    documents: [
      {
        key: 'affixProof',
        label: 'Attestation d’affixe',
        description: 'Document officiel de la société centrale.',
        mandatory: true,
      },
      {
        key: 'sanitary',
        label: 'Certificats sanitaires',
        description: 'Bilans vétérinaires récents.',
        mandatory: true,
      },
    ],
  },
  boutique: {
    id: 'boutique',
    label: 'Boutique',
    chipLabel: 'Boutique',
    description: 'Commerces, concept stores, ventes alimentation & accessoires.',
    sections: [
      {
        key: 'registration',
        title: 'Informations commerciales',
        subtitle: 'Identifiants légaux et adresse.',
        fields: [
          {
            key: 'tradeName',
            label: 'Nom commercial',
            placeholder: 'Maison des Chats',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'siret',
            label: 'Numéro SIRET',
            placeholder: '12345678901234',
            inputType: 'number',
            validation: {
              required: true,
              pattern: /^[0-9]{14}$/,
              patternMessage: 'SIRET attendu : 14 chiffres',
            },
          },
          {
            key: 'boutiqueAddress',
            label: 'Adresse de la boutique',
            placeholder: '6 avenue Victor Hugo, 75016 Paris',
            inputType: 'text',
            validation: { required: true },
          },
        ],
      },
      {
        key: 'operations',
        title: 'Activité',
        subtitle: 'Licences et catalogue.',
        fields: [
          {
            key: 'animalLicenseNumber',
            label: 'Licence vente animaux/alimentation',
            placeholder: 'LIC-75-4521',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'catalogCategories',
            label: 'Catégories vendues',
            placeholder: 'Sélectionnez',
            inputType: 'multiselect',
            options: ['Nutrition', 'Accessoires', 'Hygiène', 'Services', 'Jouets', 'Bien-être'],
            validation: { required: true },
          },
          {
            key: 'openingHours',
            label: 'Horaires',
            placeholder: 'Lun-Sam 10h-19h',
            inputType: 'text',
            multiline: true,
            validation: { required: true },
          },
          {
            key: 'registrationProofUrl',
            label: 'Justificatif d’immatriculation',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
        ],
      },
    ],
    documents: [
      {
        key: 'kbis',
        label: 'Extrait Kbis',
        description: 'Kbis ou registre équivalent < 3 mois.',
        mandatory: true,
      },
      {
        key: 'license',
        label: 'Licence de vente',
        description: 'Autorisation préfectorale pour vente animaux/alimentation.',
        mandatory: true,
      },
    ],
  },
  educator: {
    id: 'educator',
    label: 'Éducateur',
    chipLabel: 'Éducateur',
    description: 'Éducateurs et comportementalistes félins certifiés.',
    sections: [
      {
        key: 'identity',
        title: 'Identité professionnelle',
        subtitle: 'Présentez votre activité et vos certifications.',
        fields: [
          {
            key: 'fullName',
            label: 'Nom complet',
            placeholder: 'Marie Dubois',
            inputType: 'text',
            validation: { required: true, minLength: 4 },
          },
          {
            key: 'businessName',
            label: 'Nom de l\'activité',
            placeholder: 'Éducation Féline Paris',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'certificationNumber',
            label: 'Numéro de certification',
            placeholder: 'CERT-EDU-2024-001',
            inputType: 'text',
            validation: { required: true },
          },
          {
            key: 'businessEmail',
            label: 'Email professionnel',
            placeholder: 'contact@education-feline.fr',
            inputType: 'email',
            validation: {
              required: true,
              pattern: EMAIL_PATTERN,
              patternMessage: 'Email professionnel invalide',
            },
          },
          {
            key: 'businessPhone',
            label: 'Téléphone professionnel',
            placeholder: '+33143070106',
            inputType: 'phone',
            validation: {
              required: true,
              pattern: PHONE_PATTERN,
              patternMessage: 'Téléphone au format international',
            },
          },
        ],
      },
      {
        key: 'expertise',
        title: 'Expertises & méthodes',
        subtitle: 'Spécialités et approches éducatives.',
        fields: [
          {
            key: 'specialties',
            label: 'Spécialités',
            placeholder: 'Sélectionnez vos spécialités',
            inputType: 'multiselect',
            options: ['Comportement', 'Éducation chaton', 'Problèmes de propreté', 'Agressivité', 'Anxiété', 'Socialisation'],
            validation: { required: true, minLength: 1 },
          },
          {
            key: 'methods',
            label: 'Méthodes utilisées',
            placeholder: 'Décrivez vos approches',
            inputType: 'text',
            multiline: true,
            validation: { required: true, minLength: 20 },
          },
          {
            key: 'website',
            label: 'Site web',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: false,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
          {
            key: 'certificationProofUrl',
            label: 'Justificatif de certification',
            placeholder: 'https://...',
            inputType: 'url',
            validation: {
              required: true,
              pattern: URL_PATTERN,
              patternMessage: 'URL invalide',
            },
          },
        ],
      },
    ],
    documents: [
      {
        key: 'certification',
        label: 'Certificat de formation',
        description: 'Diplôme ou certification d\'éducateur/comportementaliste.',
        mandatory: true,
      },
      {
        key: 'insurance',
        label: 'Assurance RC Pro',
        description: 'Attestation d\'assurance responsabilité civile professionnelle.',
        mandatory: true,
      },
    ],
  },
};

export type ActivityFormValues = Record<string, FieldValue>;
export type ActivityValuesMap = Record<ProfessionalActivityType, ActivityFormValues>;

export const createActivityInitialValues = (): ActivityValuesMap => {
  const entries = Object.entries(PROFESSIONAL_ACTIVITY_CONFIG).map(([key, config]) => {
    const values: ActivityFormValues = {};
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        values[field.key] = field.inputType === 'multiselect' ? [] : '';
      });
    });
    return [key, values];
  });
  return Object.fromEntries(entries) as ActivityValuesMap;
};

export const validateActivityValues = (
  activityType: ProfessionalActivityType,
  values: ActivityFormValues,
): Record<string, string> => {
  const config = PROFESSIONAL_ACTIVITY_CONFIG[activityType];
  const errors: Record<string, string> = {};

  config.sections.forEach(section => {
    section.fields.forEach(field => {
      const value = values[field.key];
      const validation = field.validation;

      if (field.inputType === 'multiselect') {
        const listValue = Array.isArray(value) ? value : [];
        if (validation.required && listValue.length === 0) {
          errors[field.key] = 'Sélection requise';
        }
        return;
      }

      const textValue = typeof value === 'string' ? value.trim() : '';
      if (validation.required && !textValue) {
        errors[field.key] = 'Champ requis';
        return;
      }
      if (validation.minLength && textValue && textValue.length < validation.minLength) {
        errors[field.key] = `Min. ${validation.minLength} caractères`;
        return;
      }
      if (validation.maxLength && textValue.length > validation.maxLength) {
        errors[field.key] = `Max. ${validation.maxLength} caractères`;
        return;
      }
      if (validation.pattern && textValue && !validation.pattern.test(textValue)) {
        errors[field.key] = validation.patternMessage || 'Format invalide';
      }
    });
  });

  return errors;
};
