import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { EmergencyContact } from '@/models';

export const [EmergencyContext, useEmergency] = createContextHook(() => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    loadEmergencyContacts();
    getCurrentLocation();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('emergency_contacts');
      if (stored) {
        setEmergencyContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const saveEmergencyContacts = async (contacts: EmergencyContact[]) => {
    try {
      await AsyncStorage.setItem('emergency_contacts', JSON.stringify(contacts));
      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
    }
  };

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
    };
    const updatedContacts = [...emergencyContacts, newContact];
    await saveEmergencyContacts(updatedContacts);
  };

  const removeEmergencyContact = async (contactId: string) => {
    const updatedContacts = emergencyContacts.filter(c => c.id !== contactId);
    await saveEmergencyContacts(updatedContacts);
  };

  const updateEmergencyContact = async (contactId: string, updates: Partial<EmergencyContact>) => {
    const updatedContacts = emergencyContacts.map(c =>
      c.id === contactId ? { ...c, ...updates } : c
    );
    await saveEmergencyContacts(updatedContacts);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const activateEmergencyMode = () => {
    setIsEmergencyMode(true);
    getCurrentLocation();
  };

  const deactivateEmergencyMode = () => {
    setIsEmergencyMode(false);
  };

  const getVeterinarianContacts = () => {
    return emergencyContacts.filter(contact => contact.isVeterinarian && contact.isActive);
  };

  const getGeneralContacts = () => {
    return emergencyContacts.filter(contact => !contact.isVeterinarian && contact.isActive);
  };

  return {
    emergencyContacts,
    isEmergencyMode,
    userLocation,
    addEmergencyContact,
    removeEmergencyContact,
    updateEmergencyContact,
    activateEmergencyMode,
    deactivateEmergencyMode,
    getCurrentLocation,
    getVeterinarianContacts,
    getGeneralContacts,
  };
});