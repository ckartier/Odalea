import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Input from '@/components/Input';
import { COLORS } from '@/constants/colors';
import { ProfessionalCommonInfo } from '@/types';

interface CommonInfoFormProps {
  values: ProfessionalCommonInfo;
  onChange: (path: string, value: string) => void;
  errors: Record<string, string | undefined>;
}

const CommonInfoForm: React.FC<CommonInfoFormProps> = ({ values, onChange, errors }) => (
  <View style={styles.container}>
    <Text style={styles.sectionTitle}>Socle commun</Text>
    <Text style={styles.sectionSubtitle}>Identité, contact et justificatifs accessibles à toutes les activités.</Text>
    <Input
      label="Nom / Structure"
      placeholder="Nom public affiché"
      value={values.displayName}
      onChangeText={text => onChange('displayName', text)}
      error={errors['common.displayName']}
      testID="common-displayName-input"
    />
    <Input
      label="Email de contact"
      placeholder="contact@structure.com"
      keyboardType="email-address"
      autoCapitalize="none"
      value={values.contactEmail}
      onChangeText={text => onChange('contactEmail', text)}
      error={errors['common.contactEmail']}
      testID="common-contactEmail-input"
    />
    <Input
      label="Téléphone de contact"
      placeholder="+33143070106"
      keyboardType="phone-pad"
      value={values.contactPhone}
      onChangeText={text => onChange('contactPhone', text)}
      error={errors['common.contactPhone']}
      testID="common-contactPhone-input"
    />
    <Input
      label="Adresse"
      placeholder="12 rue des Lilas"
      value={values.address.street}
      onChangeText={text => onChange('address.street', text)}
      error={errors['common.address.street']}
      testID="common-address-street-input"
    />
    <View style={styles.row}>
      <Input
        label="Code postal"
        placeholder="75012"
        value={values.address.postcode}
        onChangeText={text => onChange('address.postcode', text)}
        error={errors['common.address.postcode']}
        containerStyle={styles.zip}
        keyboardType="number-pad"
        testID="common-address-postcode-input"
      />
      <Input
        label="Ville"
        placeholder="Paris"
        value={values.address.city}
        onChangeText={text => onChange('address.city', text)}
        error={errors['common.address.city']}
        containerStyle={styles.city}
        testID="common-address-city-input"
      />
    </View>
    <Input
      label="Pays"
      placeholder="France"
      value={values.address.country}
      onChangeText={text => onChange('address.country', text)}
      error={errors['common.address.country']}
      testID="common-address-country-input"
    />
    <Input
      label="Description"
      placeholder="Décrivez votre mission"
      multiline
      numberOfLines={3}
      value={values.description}
      onChangeText={text => onChange('description', text)}
      error={errors['common.description']}
      testID="common-description-input"
    />
    <Input
      label="Preuve d’identité"
      placeholder="URL vers justificatif"
      keyboardType="url"
      autoCapitalize="none"
      value={values.identityProofUrl}
      onChangeText={text => onChange('identityProofUrl', text)}
      error={errors['common.identityProofUrl']}
      testID="common-identityProofUrl-input"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  zip: {
    flex: 0.4,
  },
  city: {
    flex: 0.6,
  },
});

export default React.memo(CommonInfoForm);
