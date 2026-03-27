export interface Veterinarian {
  id: string;
  name: string;
  clinicName: string;
  photo?: string;
  specialties: string[];
  address: string;
  city: string;
  zipCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPartner: boolean;
  openingHours: {
    [day: string]: { open: string; close: string } | null;
  };
  emergencyAvailable: boolean;
  consultationPrice: number;
  nextAvailableSlot?: string;
  distance?: number;
}

export const MOCK_VETERINARIANS: Veterinarian[] = [
  {
    id: 'vet_1',
    name: 'Dr. Marie Dupont',
    clinicName: 'Clinique Vétérinaire du Parc',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
    specialties: ['Médecine générale', 'Chirurgie', 'Dermatologie'],
    address: '12 Avenue des Champs',
    city: 'Paris',
    zipCode: '75008',
    location: { latitude: 48.8738, longitude: 2.2950 },
    phone: '+33 1 42 56 78 90',
    email: 'contact@vetduparc.fr',
    rating: 4.8,
    reviewCount: 127,
    isVerified: true,
    isPartner: true,
    openingHours: {
      lundi: { open: '09:00', close: '19:00' },
      mardi: { open: '09:00', close: '19:00' },
      mercredi: { open: '09:00', close: '19:00' },
      jeudi: { open: '09:00', close: '19:00' },
      vendredi: { open: '09:00', close: '19:00' },
      samedi: { open: '09:00', close: '13:00' },
      dimanche: null,
    },
    emergencyAvailable: true,
    consultationPrice: 55,
    nextAvailableSlot: 'Aujourd\'hui à 14h30',
  },
  {
    id: 'vet_2',
    name: 'Dr. Thomas Bernard',
    clinicName: 'Vétérinaires Associés',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
    specialties: ['Médecine générale', 'Cardiologie', 'Échographie'],
    address: '45 Rue de la République',
    city: 'Lyon',
    zipCode: '69002',
    location: { latitude: 45.7640, longitude: 4.8357 },
    phone: '+33 4 72 34 56 78',
    email: 'rdv@vetassocies.fr',
    rating: 4.6,
    reviewCount: 89,
    isVerified: true,
    isPartner: true,
    openingHours: {
      lundi: { open: '08:30', close: '18:30' },
      mardi: { open: '08:30', close: '18:30' },
      mercredi: { open: '08:30', close: '18:30' },
      jeudi: { open: '08:30', close: '18:30' },
      vendredi: { open: '08:30', close: '18:30' },
      samedi: { open: '09:00', close: '12:00' },
      dimanche: null,
    },
    emergencyAvailable: false,
    consultationPrice: 48,
    nextAvailableSlot: 'Demain à 10h00',
  },
  {
    id: 'vet_3',
    name: 'Dr. Sophie Martin',
    clinicName: 'Centre Vétérinaire 24h',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
    specialties: ['Urgences', 'Médecine générale', 'Radiologie'],
    address: '78 Boulevard Haussmann',
    city: 'Paris',
    zipCode: '75009',
    location: { latitude: 48.8744, longitude: 2.3276 },
    phone: '+33 1 48 90 12 34',
    email: 'urgences@vet24h.fr',
    rating: 4.9,
    reviewCount: 234,
    isVerified: true,
    isPartner: true,
    openingHours: {
      lundi: { open: '00:00', close: '23:59' },
      mardi: { open: '00:00', close: '23:59' },
      mercredi: { open: '00:00', close: '23:59' },
      jeudi: { open: '00:00', close: '23:59' },
      vendredi: { open: '00:00', close: '23:59' },
      samedi: { open: '00:00', close: '23:59' },
      dimanche: { open: '00:00', close: '23:59' },
    },
    emergencyAvailable: true,
    consultationPrice: 75,
    nextAvailableSlot: 'Disponible maintenant',
  },
  {
    id: 'vet_4',
    name: 'Dr. Pierre Lefebvre',
    clinicName: 'Clinique des Animaux de Compagnie',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop',
    specialties: ['Médecine générale', 'Dentisterie', 'Nutrition'],
    address: '23 Rue du Commerce',
    city: 'Bordeaux',
    zipCode: '33000',
    location: { latitude: 44.8378, longitude: -0.5792 },
    phone: '+33 5 56 78 90 12',
    email: 'contact@clinique-animaux.fr',
    rating: 4.5,
    reviewCount: 67,
    isVerified: true,
    isPartner: false,
    openingHours: {
      lundi: { open: '09:00', close: '18:00' },
      mardi: { open: '09:00', close: '18:00' },
      mercredi: { open: '09:00', close: '18:00' },
      jeudi: { open: '09:00', close: '18:00' },
      vendredi: { open: '09:00', close: '18:00' },
      samedi: null,
      dimanche: null,
    },
    emergencyAvailable: false,
    consultationPrice: 42,
    nextAvailableSlot: 'Jeudi à 11h00',
  },
  {
    id: 'vet_5',
    name: 'Dr. Claire Rousseau',
    clinicName: 'Vétérinaire Félin Expert',
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop',
    specialties: ['Spécialiste félin', 'Comportement', 'Médecine interne'],
    address: '56 Avenue Montaigne',
    city: 'Paris',
    zipCode: '75016',
    location: { latitude: 48.8661, longitude: 2.3044 },
    phone: '+33 1 45 67 89 01',
    email: 'rdv@felinexpert.fr',
    rating: 4.7,
    reviewCount: 156,
    isVerified: true,
    isPartner: true,
    openingHours: {
      lundi: { open: '10:00', close: '19:00' },
      mardi: { open: '10:00', close: '19:00' },
      mercredi: { open: '10:00', close: '19:00' },
      jeudi: { open: '10:00', close: '19:00' },
      vendredi: { open: '10:00', close: '19:00' },
      samedi: { open: '10:00', close: '14:00' },
      dimanche: null,
    },
    emergencyAvailable: false,
    consultationPrice: 65,
    nextAvailableSlot: 'Vendredi à 15h30',
  },
];

export function getVeterinarianById(id: string): Veterinarian | undefined {
  return MOCK_VETERINARIANS.find(vet => vet.id === id);
}

export function getVeterinariansWithEmergency(): Veterinarian[] {
  return MOCK_VETERINARIANS.filter(vet => vet.emergencyAvailable);
}

export function getPartnerVeterinarians(): Veterinarian[] {
  return MOCK_VETERINARIANS.filter(vet => vet.isPartner);
}
