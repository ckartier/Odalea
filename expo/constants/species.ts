export interface Species {
  id: string;
  name: string;
  category: 'dogs' | 'cats' | 'rodents' | 'birds' | 'reptiles' | 'fish' | 'farm' | 'exotic' | 'other';
}

export interface SpeciesCategory {
  id: string;
  name: string;
  species: Species[];
}

export const SPECIES_CATEGORIES: SpeciesCategory[] = [
  {
    id: 'dogs',
    name: 'Chiens',
    species: [
      { id: 'dog', name: 'Chien', category: 'dogs' },
    ],
  },
  {
    id: 'cats',
    name: 'Chats',
    species: [
      { id: 'cat', name: 'Chat', category: 'cats' },
    ],
  },
  {
    id: 'rodents',
    name: 'Rongeurs',
    species: [
      { id: 'rabbit', name: 'Lapin', category: 'rodents' },
      { id: 'hamster', name: 'Hamster', category: 'rodents' },
      { id: 'guinea_pig', name: 'Cochon d\'Inde', category: 'rodents' },
      { id: 'rat', name: 'Rat', category: 'rodents' },
      { id: 'mouse', name: 'Souris', category: 'rodents' },
      { id: 'chinchilla', name: 'Chinchilla', category: 'rodents' },
      { id: 'ferret', name: 'Furet', category: 'rodents' },
      { id: 'gerbil', name: 'Gerbille', category: 'rodents' },
    ],
  },
  {
    id: 'birds',
    name: 'Oiseaux',
    species: [
      { id: 'parrot', name: 'Perroquet', category: 'birds' },
      { id: 'budgie', name: 'Perruche', category: 'birds' },
      { id: 'canary', name: 'Canari', category: 'birds' },
      { id: 'cockatiel', name: 'Calopsitte', category: 'birds' },
      { id: 'cockatoo', name: 'Cacatoès', category: 'birds' },
      { id: 'lovebird', name: 'Inséparable', category: 'birds' },
      { id: 'finch', name: 'Pinson', category: 'birds' },
      { id: 'pigeon', name: 'Pigeon', category: 'birds' },
    ],
  },
  {
    id: 'reptiles',
    name: 'Reptiles',
    species: [
      { id: 'snake', name: 'Serpent', category: 'reptiles' },
      { id: 'gecko', name: 'Gecko', category: 'reptiles' },
      { id: 'iguana', name: 'Iguane', category: 'reptiles' },
      { id: 'turtle', name: 'Tortue', category: 'reptiles' },
      { id: 'chameleon', name: 'Caméléon', category: 'reptiles' },
      { id: 'bearded_dragon', name: 'Dragon barbu', category: 'reptiles' },
      { id: 'monitor', name: 'Varan', category: 'reptiles' },
    ],
  },
  {
    id: 'fish',
    name: 'Poissons',
    species: [
      { id: 'goldfish', name: 'Poisson rouge', category: 'fish' },
      { id: 'betta', name: 'Combattant', category: 'fish' },
      { id: 'guppy', name: 'Guppy', category: 'fish' },
      { id: 'koi', name: 'Carpe Koï', category: 'fish' },
      { id: 'tropical_fish', name: 'Poisson tropical', category: 'fish' },
    ],
  },
  {
    id: 'farm',
    name: 'Animaux de ferme',
    species: [
      { id: 'horse', name: 'Cheval', category: 'farm' },
      { id: 'pony', name: 'Poney', category: 'farm' },
      { id: 'donkey', name: 'Âne', category: 'farm' },
      { id: 'goat', name: 'Chèvre', category: 'farm' },
      { id: 'sheep', name: 'Mouton', category: 'farm' },
      { id: 'pig', name: 'Cochon', category: 'farm' },
      { id: 'chicken', name: 'Poule', category: 'farm' },
      { id: 'duck', name: 'Canard', category: 'farm' },
    ],
  },
  {
    id: 'exotic',
    name: 'NAC / Exotiques',
    species: [
      { id: 'hedgehog', name: 'Hérisson', category: 'exotic' },
      { id: 'sugar_glider', name: 'Phalanger volant', category: 'exotic' },
      { id: 'axolotl', name: 'Axolotl', category: 'exotic' },
      { id: 'tarantula', name: 'Mygale', category: 'exotic' },
      { id: 'scorpion', name: 'Scorpion', category: 'exotic' },
      { id: 'hermit_crab', name: 'Bernard-l\'hermite', category: 'exotic' },
      { id: 'frog', name: 'Grenouille', category: 'exotic' },
      { id: 'snail', name: 'Escargot', category: 'exotic' },
    ],
  },
  {
    id: 'other',
    name: 'Autre',
    species: [
      { id: 'other', name: 'Autre animal', category: 'other' },
    ],
  },
];

export const ALL_SPECIES = SPECIES_CATEGORIES.flatMap(cat => cat.species);

export const CHARACTER_TRAITS = [
  { id: 'joueur', label: 'Joueur' },
  { id: 'calme', label: 'Calme' },
  { id: 'calin', label: 'Câlin' },
  { id: 'independant', label: 'Indépendant' },
  { id: 'sociable', label: 'Sociable' },
  { id: 'peureux', label: 'Peureux' },
  { id: 'protecteur', label: 'Protecteur' },
  { id: 'energique', label: 'Énergique' },
  { id: 'gourmand', label: 'Gourmand' },
  { id: 'curieux', label: 'Curieux' },
  { id: 'timide', label: 'Timide' },
  { id: 'obéissant', label: 'Obéissant' },
];

export const COLOR_OPTIONS = [
  { id: 'noir', label: 'Noir' },
  { id: 'blanc', label: 'Blanc' },
  { id: 'marron', label: 'Marron' },
  { id: 'fauve', label: 'Fauve' },
  { id: 'gris', label: 'Gris' },
  { id: 'roux', label: 'Roux' },
  { id: 'crème', label: 'Crème' },
  { id: 'tigré', label: 'Tigré' },
  { id: 'tricolore', label: 'Tricolore' },
  { id: 'bicolore', label: 'Bicolore' },
  { id: 'autre', label: 'Autre' },
];
