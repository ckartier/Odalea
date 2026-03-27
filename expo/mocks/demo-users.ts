export interface DemoUser {
  id: string;
  pseudonym: string;
  firstName: string;
  lastName: string;
  city: string;
  zipCode: string;
  photo?: string;
  isOnline: boolean;
  lastActive: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-1',
    pseudonym: 'CatLover75',
    firstName: 'Sophie',
    lastName: 'Martin',
    city: 'Paris',
    zipCode: '75011',
    isOnline: true,
    lastActive: 'Now',
  },
  {
    id: 'user-2',
    pseudonym: 'MaxLeChat',
    firstName: 'Thomas',
    lastName: 'Dubois',
    city: 'Lyon',
    zipCode: '69002',
    isOnline: false,
    lastActive: '2h ago',
  }
];
