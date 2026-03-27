import { Breed } from '@/types';

export const breeds: Breed[] = [
  // ============ RACES DE CHIENS ============
  // Races populaires
  { id: 'dog-1', name: 'Labrador Retriever', type: 'domestic' },
  { id: 'dog-2', name: 'Golden Retriever', type: 'domestic' },
  { id: 'dog-3', name: 'Berger Allemand', type: 'domestic' },
  { id: 'dog-4', name: 'Bouledogue Français', type: 'domestic' },
  { id: 'dog-5', name: 'Caniche', type: 'domestic' },
  { id: 'dog-6', name: 'Beagle', type: 'domestic' },
  { id: 'dog-7', name: 'Rottweiler', type: 'domestic' },
  { id: 'dog-8', name: 'Yorkshire Terrier', type: 'domestic' },
  { id: 'dog-9', name: 'Boxer', type: 'domestic' },
  { id: 'dog-10', name: 'Teckel', type: 'domestic' },
  
  // Bergers
  { id: 'dog-11', name: 'Border Collie', type: 'domestic' },
  { id: 'dog-12', name: 'Berger Australien', type: 'domestic' },
  { id: 'dog-13', name: 'Berger Belge Malinois', type: 'domestic' },
  { id: 'dog-14', name: 'Berger des Shetland', type: 'domestic' },
  { id: 'dog-15', name: 'Berger Blanc Suisse', type: 'domestic' },
  { id: 'dog-16', name: 'Berger des Pyrénées', type: 'domestic' },
  
  // Terriers
  { id: 'dog-17', name: 'Jack Russell Terrier', type: 'domestic' },
  { id: 'dog-18', name: 'Bull Terrier', type: 'domestic' },
  { id: 'dog-19', name: 'Staffordshire Bull Terrier', type: 'domestic' },
  { id: 'dog-20', name: 'West Highland White Terrier', type: 'domestic' },
  { id: 'dog-21', name: 'Fox Terrier', type: 'domestic' },
  { id: 'dog-22', name: 'Scottish Terrier', type: 'domestic' },
  { id: 'dog-23', name: 'Airedale Terrier', type: 'domestic' },
  
  // Chiens de chasse
  { id: 'dog-24', name: 'Cocker Spaniel Anglais', type: 'domestic' },
  { id: 'dog-25', name: 'Springer Spaniel Anglais', type: 'domestic' },
  { id: 'dog-26', name: 'Épagneul Breton', type: 'domestic' },
  { id: 'dog-27', name: 'Setter Irlandais', type: 'domestic' },
  { id: 'dog-28', name: 'Braque Allemand', type: 'domestic' },
  { id: 'dog-29', name: 'Pointer', type: 'domestic' },
  { id: 'dog-30', name: 'Weimaraner', type: 'domestic' },
  
  // Chiens nordiques
  { id: 'dog-31', name: 'Husky Sibérien', type: 'domestic' },
  { id: 'dog-32', name: 'Malamute d\'Alaska', type: 'domestic' },
  { id: 'dog-33', name: 'Samoyède', type: 'domestic' },
  { id: 'dog-34', name: 'Akita Inu', type: 'domestic' },
  { id: 'dog-35', name: 'Shiba Inu', type: 'domestic' },
  
  // Molosses
  { id: 'dog-36', name: 'Dogue Allemand', type: 'domestic' },
  { id: 'dog-37', name: 'Mastiff', type: 'domestic' },
  { id: 'dog-38', name: 'Bullmastiff', type: 'domestic' },
  { id: 'dog-39', name: 'Cane Corso', type: 'domestic' },
  { id: 'dog-40', name: 'Dogue de Bordeaux', type: 'domestic' },
  { id: 'dog-41', name: 'Boerboel', type: 'domestic' },
  { id: 'dog-42', name: 'Dogue Argentin', type: 'domestic' },
  
  // Chiens de compagnie
  { id: 'dog-43', name: 'Chihuahua', type: 'domestic' },
  { id: 'dog-44', name: 'Bichon Frisé', type: 'domestic' },
  { id: 'dog-45', name: 'Bichon Maltais', type: 'domestic' },
  { id: 'dog-46', name: 'Cavalier King Charles Spaniel', type: 'domestic' },
  { id: 'dog-47', name: 'Carlin', type: 'domestic' },
  { id: 'dog-48', name: 'Shih Tzu', type: 'domestic' },
  { id: 'dog-49', name: 'Pékinois', type: 'domestic' },
  { id: 'dog-50', name: 'Papillon', type: 'domestic' },
  { id: 'dog-51', name: 'Lhassa Apso', type: 'domestic' },
  
  // Autres races populaires
  { id: 'dog-52', name: 'Dalmatien', type: 'domestic' },
  { id: 'dog-53', name: 'Doberman', type: 'domestic' },
  { id: 'dog-54', name: 'Terre-Neuve', type: 'domestic' },
  { id: 'dog-55', name: 'Saint-Bernard', type: 'domestic' },
  { id: 'dog-56', name: 'Leonberg', type: 'domestic' },
  { id: 'dog-57', name: 'Shar Pei', type: 'domestic' },
  { id: 'dog-58', name: 'Chow Chow', type: 'domestic' },
  { id: 'dog-59', name: 'Basenji', type: 'domestic' },
  { id: 'dog-60', name: 'Rhodesian Ridgeback', type: 'domestic' },
  
  // Lévriers
  { id: 'dog-61', name: 'Greyhound', type: 'domestic' },
  { id: 'dog-62', name: 'Whippet', type: 'domestic' },
  { id: 'dog-63', name: 'Lévrier Afghan', type: 'domestic' },
  { id: 'dog-64', name: 'Saluki', type: 'domestic' },
  { id: 'dog-65', name: 'Lévrier Italien', type: 'domestic' },
  
  // Races françaises
  { id: 'dog-66', name: 'Bouvier Bernois', type: 'domestic' },
  { id: 'dog-67', name: 'Briard', type: 'domestic' },
  { id: 'dog-68', name: 'Barbet', type: 'domestic' },
  { id: 'dog-69', name: 'Griffon', type: 'domestic' },
  { id: 'dog-70', name: 'Basset Hound', type: 'domestic' },
  
  // Races diverses
  { id: 'dog-71', name: 'Boston Terrier', type: 'domestic' },
  { id: 'dog-72', name: 'Bulldog Anglais', type: 'domestic' },
  { id: 'dog-73', name: 'Schnauzer', type: 'domestic' },
  { id: 'dog-74', name: 'Schnauzer Géant', type: 'domestic' },
  { id: 'dog-75', name: 'Schnauzer Nain', type: 'domestic' },
  { id: 'dog-76', name: 'Coton de Tuléar', type: 'domestic' },
  { id: 'dog-77', name: 'Poméranien', type: 'domestic' },
  { id: 'dog-78', name: 'Spitz Allemand', type: 'domestic' },
  { id: 'dog-79', name: 'Keeshond', type: 'domestic' },
  { id: 'dog-80', name: 'Elkhound Norvégien', type: 'domestic' },
  
  // Races asiatiques
  { id: 'dog-81', name: 'Kai Ken', type: 'domestic' },
  { id: 'dog-82', name: 'Hokkaido', type: 'domestic' },
  { id: 'dog-83', name: 'Kishu', type: 'domestic' },
  { id: 'dog-84', name: 'Tosa', type: 'domestic' },
  { id: 'dog-85', name: 'Thai Ridgeback', type: 'domestic' },
  
  // Chiens rares
  { id: 'dog-86', name: 'Berger Picard', type: 'domestic' },
  { id: 'dog-87', name: 'Bouvier des Flandres', type: 'domestic' },
  { id: 'dog-88', name: 'Beauceron', type: 'domestic' },
  { id: 'dog-89', name: 'Kuvasz', type: 'domestic' },
  { id: 'dog-90', name: 'Komondor', type: 'domestic' },
  { id: 'dog-91', name: 'Puli', type: 'domestic' },
  { id: 'dog-92', name: 'Mudi', type: 'domestic' },
  { id: 'dog-93', name: 'Bergamasco', type: 'domestic' },
  { id: 'dog-94', name: 'Schipperke', type: 'domestic' },
  { id: 'dog-95', name: 'Hovawart', type: 'domestic' },
  
  // Races nordiques et de travail
  { id: 'dog-96', name: 'Spitz Finlandais', type: 'domestic' },
  { id: 'dog-97', name: 'Chien d\'Ours de Carélie', type: 'domestic' },
  { id: 'dog-98', name: 'Chien-Loup Tchécoslovaque', type: 'domestic' },
  { id: 'dog-99', name: 'Chien-Loup de Saarloos', type: 'domestic' },
  { id: 'dog-100', name: 'Berger de Russie Méridionale', type: 'domestic' },
  
  // Nouvelles races et croisements
  { id: 'dog-101', name: 'Labradoodle', type: 'domestic' },
  { id: 'dog-102', name: 'Goldendoodle', type: 'domestic' },
  { id: 'dog-103', name: 'Cockapoo', type: 'domestic' },
  { id: 'dog-104', name: 'Cavapoo', type: 'domestic' },
  { id: 'dog-105', name: 'Puggle', type: 'domestic' },
  
  // Races de travail et sauvetage
  { id: 'dog-106', name: 'Chien de Montagne des Pyrénées', type: 'domestic' },
  { id: 'dog-107', name: 'Bouvier de l\'Entlebuch', type: 'domestic' },
  { id: 'dog-108', name: 'Bouvier d\'Appenzell', type: 'domestic' },
  { id: 'dog-109', name: 'Grand Bouvier Suisse', type: 'domestic' },
  { id: 'dog-110', name: 'Chien de l\'Atlas', type: 'domestic' },
  
  // Autres
  { id: 'dog-111', name: 'Chien Courant', type: 'domestic' },
  { id: 'dog-112', name: 'Petit Chien Lion', type: 'domestic' },
  { id: 'dog-113', name: 'Xoloitzcuintle', type: 'exotic' },
  { id: 'dog-114', name: 'Chien Nu du Pérou', type: 'exotic' },
  { id: 'dog-115', name: 'Chien Nu Chinois', type: 'exotic' },
  { id: 'dog-116', name: 'Azawakh', type: 'domestic' },
  { id: 'dog-117', name: 'Sloughi', type: 'domestic' },
  { id: 'dog-118', name: 'Podenco Ibicenco', type: 'domestic' },
  { id: 'dog-119', name: 'Cirneco de l\'Etna', type: 'domestic' },
  { id: 'dog-120', name: 'Pharaon Hound', type: 'domestic' },
  
  // Races de luxe
  { id: 'dog-121', name: 'Bichon Havanais', type: 'domestic' },
  { id: 'dog-122', name: 'Bichon Bolonais', type: 'domestic' },
  { id: 'dog-123', name: 'Löwchen', type: 'domestic' },
  { id: 'dog-124', name: 'Affenpinscher', type: 'domestic' },
  { id: 'dog-125', name: 'Brussels Griffon', type: 'domestic' },
  
  // Autres races mixtes
  { id: 'dog-126', name: 'Corniaud', type: 'domestic' },
  { id: 'dog-127', name: 'Bâtard', type: 'domestic' },
  { id: 'dog-128', name: 'Race Mixte', type: 'domestic' },
  { id: 'dog-129', name: 'Croisé', type: 'domestic' },
  { id: 'dog-130', name: 'Non Défini', type: 'domestic' },
  
  
  // ============ RACES DE CHATS ============
  // Domestic Breeds
  { id: 'cat-1', name: 'Siamois', type: 'domestic' },
  { id: 'cat-2', name: 'Persan', type: 'domestic' },
  { id: 'cat-3', name: 'Maine Coon', type: 'domestic' },
  { id: 'cat-4', name: 'Ragdoll', type: 'domestic' },
  { id: 'cat-5', name: 'Bengal', type: 'domestic' },
  { id: 'cat-6', name: 'Sphynx', type: 'domestic' },
  { id: 'cat-7', name: 'British Shorthair', type: 'domestic' },
  { id: 'cat-8', name: 'Abyssin', type: 'domestic' },
  { id: 'cat-9', name: 'Scottish Fold', type: 'domestic' },
  { id: 'cat-10', name: 'Birman', type: 'domestic' },
  { id: 'cat-11', name: 'Burmese', type: 'domestic' },
  { id: 'cat-12', name: 'Bleu Russe', type: 'domestic' },
  { id: 'cat-13', name: 'Chat des Forêts Norvégiennes', type: 'domestic' },
  { id: 'cat-14', name: 'Sibérien', type: 'domestic' },
  { id: 'cat-15', name: 'Devon Rex', type: 'domestic' },
  { id: 'cat-16', name: 'Chat de Gouttière', type: 'domestic' },
  { id: 'cat-17', name: 'Européen', type: 'domestic' },
  { id: 'cat-18', name: 'Chartreux', type: 'domestic' },
  { id: 'cat-19', name: 'Angora Turc', type: 'domestic' },
  { id: 'cat-20', name: 'Exotic Shorthair', type: 'domestic' },
  
  // Exotic Cat Breeds
  { id: 'cat-21', name: 'Savannah', type: 'exotic' },
  { id: 'cat-22', name: 'Serval', type: 'exotic' },
  { id: 'cat-23', name: 'Caracal', type: 'exotic' },
  { id: 'cat-24', name: 'Ocelot', type: 'exotic' },
  { id: 'cat-25', name: 'Chausie', type: 'exotic' },
  { id: 'cat-26', name: 'Bengal (F1-F3)', type: 'exotic' },
  { id: 'cat-27', name: 'Toyger', type: 'exotic' },
  { id: 'cat-28', name: 'Pixie-Bob', type: 'exotic' },
  { id: 'cat-29', name: 'Safari Cat', type: 'exotic' },
  { id: 'cat-30', name: 'Jungle Curl', type: 'exotic' },
];
