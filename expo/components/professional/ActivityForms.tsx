import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Input from '@/components/Input';
import { COLORS } from '@/constants/colors';
import {
  ActivityConfig,
  ActivityFormValues,
  ActivityFieldConfig,
  PROFESSIONAL_ACTIVITY_CONFIG,
} from '@/constants/professionalActivities';

interface ActivityFormProps {
  values: ActivityFormValues;
  onChange: (key: string, value: string | string[]) => void;
  errors: Record<string, string | undefined>;
  testIDPrefix: string;
}

const ProfessionalActivityForm: React.FC<ActivityFormProps & { config: ActivityConfig }> = ({
  config,
  values,
  onChange,
  errors,
  testIDPrefix,
}) => (
  <View style={styles.wrapper}>
    {config.sections.map(section => (
      <View key={section.key} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.subtitle ? (
          <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
        ) : null}
        {section.fields.map(field => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={onChange}
            error={errors[`activity.${config.id}.${field.key}`]}
            testID={`${testIDPrefix}-${field.key}`}
          />
        ))}
      </View>
    ))}

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Documents requis</Text>
      <Text style={styles.sectionSubtitle}>Préparez les pièces nécessaires avant de soumettre.</Text>
      {config.documents.map(doc => (
        <View key={doc.key} style={styles.documentRow} testID={`${testIDPrefix}-document-${doc.key}`}>
          <View style={[styles.documentBullet, doc.mandatory && styles.documentBulletMandatory]} />
          <View style={styles.documentTextWrapper}>
            <Text style={styles.documentTitle}>{doc.label}</Text>
            <Text style={styles.documentDescription}>{doc.description}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

interface FieldRendererProps {
  field: ActivityFieldConfig;
  value: string | string[] | undefined;
  onChange: (key: string, value: string | string[]) => void;
  error?: string;
  testID: string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, error, testID }) => {
  if (field.inputType === 'multiselect' && field.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.multiContainer}>
        <Text style={styles.multiLabel}>{field.label}</Text>
        <View style={styles.chipRow}>
          {field.options.map(option => {
            const isActive = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => {
                  const next = isActive
                    ? selected.filter(item => item !== option)
                    : [...selected, option];
                  onChange(field.key, next);
                }}
                testID={`${testID}-chip-${option}`}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const keyboardType = getKeyboardType(field.inputType);

  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      value={typeof value === 'string' ? value : ''}
      onChangeText={text => onChange(field.key, text)}
      keyboardType={keyboardType}
      autoCapitalize={field.inputType === 'email' || field.inputType === 'url' ? 'none' : 'sentences'}
      error={error}
      multiline={Boolean(field.multiline)}
      numberOfLines={field.multiline ? 3 : 1}
      testID={`${testID}-input`}
    />
  );
};

export const VetForm: React.FC<ActivityFormProps> = props => (
  <ProfessionalActivityForm {...props} config={PROFESSIONAL_ACTIVITY_CONFIG.vet} />
);

export const ShelterForm: React.FC<ActivityFormProps> = props => (
  <ProfessionalActivityForm {...props} config={PROFESSIONAL_ACTIVITY_CONFIG.shelter} />
);

export const BreederForm: React.FC<ActivityFormProps> = props => (
  <ProfessionalActivityForm {...props} config={PROFESSIONAL_ACTIVITY_CONFIG.breeder} />
);

export const BoutiqueForm: React.FC<ActivityFormProps> = props => (
  <ProfessionalActivityForm {...props} config={PROFESSIONAL_ACTIVITY_CONFIG.boutique} />
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 24,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  multiContainer: {
    marginBottom: 16,
  },
  multiLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.black,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
  },
  documentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  documentBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.mediumGray,
    marginRight: 12,
  },
  documentBulletMandatory: {
    backgroundColor: COLORS.black,
  },
  documentTextWrapper: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  documentDescription: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});

const getKeyboardType = (inputType: ActivityFieldConfig['inputType']) => {
  switch (inputType) {
    case 'email':
      return 'email-address';
    case 'phone':
      return 'phone-pad';
    case 'number':
      return 'numeric';
    case 'url':
      return 'url';
    default:
      return 'default';
  }
};

export default ProfessionalActivityForm;
