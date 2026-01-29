import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '@/services/database';
import { useUser } from './user-store';
import { safeJsonParse } from '@/lib/safe-json';
import { StorageService, sanitizeForFirestore, generateUUID } from '@/services/storage';

export interface LostPetReport {
  id: string;
  petName: string;
  species: string;
  breed?: string;
  description: string;
  lastSeenLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastSeenDate: string;
  photos: string[];
  contactInfo: {
    userId: string;
    userName: string;
    userPhoto?: string;
  };
  reward?: number;
  status: 'lost' | 'found' | 'reunited';
  createdAt: string;
  updatedAt: string;
  responses: LostPetResponse[];
}

export interface LostPetResponse {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos?: string[];
  createdAt: string;
  type: 'sighting' | 'found' | 'help_offer';
}

export interface LostPetFilter {
  species?: string[];
  distance?: number; // in km
  dateRange?: {
    from: string;
    to: string;
  };
  status?: ('lost' | 'found' | 'reunited')[];
  hasReward?: boolean;
}

export const [LostFoundContext, useLostFound] = createContextHook(() => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeFilters, setActiveFilters] = useState<LostPetFilter>({});
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);

  // Query for lost pet reports
  const lostPetsQuery = useQuery({
    queryKey: ['lostPets', activeFilters, userLocation],
    queryFn: async () => {
      try {
        const reports = await databaseService.lostFound.listReports();
        let filtered = reports.map(r => ({
          id: r.id,
          petName: r.petName || '',
          species: r.petType || r.species || '',
          breed: r.breed,
          description: r.description || '',
          lastSeenLocation: {
            latitude: Number(r.lastSeenLocation?.latitude || r.location?.latitude || 48.8566),
            longitude: Number(r.lastSeenLocation?.longitude || r.location?.longitude || 2.3522),
            address: typeof r.lastSeenLocation === 'string'
              ? r.lastSeenLocation
              : typeof r.lastSeenLocation?.address === 'string' 
                ? r.lastSeenLocation.address 
                : typeof r.address === 'string' 
                  ? r.address 
                  : 'Paris, France'
          },
          lastSeenDate: r.lastSeenDate || r.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          photos: r.photos || [],
          contactInfo: {
            userId: r.userId || '',
            userName: r.contactName || 'Utilisateur',
            userPhoto: r.userPhoto
          },
          reward: r.reward,
          status: r.status || 'lost',
          createdAt: r.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: r.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          responses: (r.responses || []).map((resp: any) => ({
            id: resp.id,
            reportId: r.id,
            userId: resp.userId || '',
            userName: resp.userName || 'Utilisateur',
            userPhoto: resp.userPhoto,
            message: resp.message || '',
            location: resp.location,
            photos: resp.photos || [],
            createdAt: resp.createdAt || new Date().toISOString(),
            type: resp.type || 'sighting'
          }))
        })) as LostPetReport[];
        
        // Apply filters
        if (activeFilters.species && activeFilters.species.length > 0) {
          filtered = filtered.filter(report => 
            activeFilters.species!.includes(report.species)
          );
        }
        
        if (activeFilters.status && activeFilters.status.length > 0) {
          filtered = filtered.filter(report => 
            activeFilters.status!.includes(report.status)
          );
        }
        
        if (activeFilters.hasReward !== undefined) {
          filtered = filtered.filter(report => 
            activeFilters.hasReward ? report.reward && report.reward > 0 : !report.reward
          );
        }
        
        // Sort by date (most recent first)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return filtered;
      } catch (error) {
        console.error('Error fetching lost pets from Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('lostPets');
        const reports: LostPetReport[] = safeJsonParse(stored, []);
        
        // Apply filters
        let filtered = reports;
        
        if (activeFilters.species && activeFilters.species.length > 0) {
          filtered = filtered.filter(report => 
            activeFilters.species!.includes(report.species)
          );
        }
        
        if (activeFilters.status && activeFilters.status.length > 0) {
          filtered = filtered.filter(report => 
            activeFilters.status!.includes(report.status)
          );
        }
        
        if (activeFilters.hasReward !== undefined) {
          filtered = filtered.filter(report => 
            activeFilters.hasReward ? report.reward && report.reward > 0 : !report.reward
          );
        }
        
        // Sort by date (most recent first)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return filtered;
      }
    },
  });

  // Mutation to create a lost pet report
  const createReportMutation = useMutation({
    mutationFn: async (report: Omit<LostPetReport, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        // Upload photos to Storage first
        let uploadedPhotos: string[] = [];
        if (report.photos && report.photos.length > 0) {
          console.log('📤 Uploading lost/found photos...', report.photos.length);
          const reportId = `report_${generateUUID()}`;
          try {
            uploadedPhotos = await StorageService.uploadLostFoundImages(
              user.id,
              reportId,
              report.photos,
              report.status === 'found' ? 'found' : 'lost'
            );
            console.log('✅ Photos uploaded:', uploadedPhotos.length);
          } catch (error) {
            console.error('❌ Failed to upload photos:', error);
            throw new Error('Échec de l\'upload des photos. Veuillez réessayer.');
          }
        }
        
        const reportData = sanitizeForFirestore({
          petName: report.petName,
          petType: report.species,
          breed: report.breed,
          description: report.description,
          lastSeenLocation: report.lastSeenLocation.address,
          lastSeenDate: report.lastSeenDate,
          contactName: report.contactInfo.userName,
          contactPhone: user.phoneNumber || '',
          contactEmail: user.email || '',
          photos: uploadedPhotos.length > 0 ? uploadedPhotos : report.photos,
          reward: report.reward,
          type: report.status,
          userId: user.id,
          location: {
            latitude: report.lastSeenLocation.latitude,
            longitude: report.lastSeenLocation.longitude
          }
        });
        
        const reportId = await databaseService.lostFound.createReport(reportData);
        
        const newReport: LostPetReport = {
          ...report,
          id: reportId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: [],
        };
        
        return newReport;
      } catch (error) {
        console.error('Error creating report in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('lostPets');
        const reports: LostPetReport[] = safeJsonParse(stored, []);
        
        const newReport: LostPetReport = {
          ...report,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: [],
        };
        
        reports.push(newReport);
        await AsyncStorage.setItem('lostPets', JSON.stringify(reports));
        
        return newReport;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostPets'] });
    },
  });

  // Mutation to respond to a lost pet report
  const respondToReportMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      response 
    }: { 
      reportId: string; 
      response: Omit<LostPetResponse, 'id' | 'createdAt' | 'reportId'> 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        // Upload response photos if any
        let uploadedResponsePhotos: string[] = [];
        if (response.photos && response.photos.length > 0) {
          console.log('📤 Uploading response photos...', response.photos.length);
          try {
            uploadedResponsePhotos = await StorageService.uploadLostFoundImages(
              user.id,
              reportId,
              response.photos,
              'found'
            );
            console.log('✅ Response photos uploaded:', uploadedResponsePhotos.length);
          } catch (error) {
            console.error('❌ Failed to upload response photos:', error);
          }
        }
        
        const responseData = sanitizeForFirestore({
          userId: user.id,
          userName: user.name || `${user.firstName} ${user.lastName}`.trim(),
          userPhoto: user.photo,
          message: response.message,
          location: response.location,
          photos: uploadedResponsePhotos.length > 0 ? uploadedResponsePhotos : (response.photos || []),
          type: response.type
        });
        
        const newResponse = await databaseService.lostFound.respondToReport(reportId, responseData);
        
        return {
          ...response,
          id: newResponse.id,
          reportId,
          createdAt: newResponse.createdAt,
          userId: user.id,
          userName: user.name || `${user.firstName} ${user.lastName}`.trim(),
          userPhoto: user.photo
        } as LostPetResponse;
      } catch (error) {
        console.error('Error responding to report in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('lostPets');
        const reports: LostPetReport[] = safeJsonParse(stored, []);
        
        const reportIndex = reports.findIndex(r => r.id === reportId);
        if (reportIndex === -1) throw new Error('Report not found');
        
        const newResponse: LostPetResponse = {
          ...response,
          id: Date.now().toString(),
          reportId,
          createdAt: new Date().toISOString(),
          userId: user.id,
          userName: user.name || `${user.firstName} ${user.lastName}`.trim(),
          userPhoto: user.photo
        };
        
        reports[reportIndex].responses.push(newResponse);
        reports[reportIndex].updatedAt = new Date().toISOString();
        
        await AsyncStorage.setItem('lostPets', JSON.stringify(reports));
        
        return newResponse;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostPets'] });
    },
  });

  // Mutation to update report status
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: LostPetReport['status'] }) => {
      try {
        await databaseService.lostFound.updateReportStatus(reportId, status);
        
        // Return updated report
        const reports = await databaseService.lostFound.listReports();
        const updatedReport = reports.find(r => r.id === reportId);
        
        if (!updatedReport) throw new Error('Report not found after update');
        
        return {
          id: updatedReport.id,
          petName: updatedReport.petName || '',
          species: updatedReport.petType || '',
          breed: updatedReport.breed,
          description: updatedReport.description || '',
          lastSeenLocation: {
            latitude: updatedReport.location?.latitude || 48.8566,
            longitude: updatedReport.location?.longitude || 2.3522,
            address: updatedReport.lastSeenLocation || 'Paris, France'
          },
          lastSeenDate: updatedReport.lastSeenDate || new Date().toISOString(),
          photos: updatedReport.photos || [],
          contactInfo: {
            userId: updatedReport.userId || '',
            userName: updatedReport.contactName || 'Utilisateur',
            userPhoto: updatedReport.userPhoto
          },
          reward: updatedReport.reward,
          status,
          createdAt: updatedReport.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: updatedReport.responses || []
        } as LostPetReport;
      } catch (error) {
        console.error('Error updating report status in Firebase:', error);
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem('lostPets');
        const reports: LostPetReport[] = safeJsonParse(stored, []);
        
        const reportIndex = reports.findIndex(r => r.id === reportId);
        if (reportIndex === -1) throw new Error('Report not found');
        
        reports[reportIndex].status = status;
        reports[reportIndex].updatedAt = new Date().toISOString();
        
        await AsyncStorage.setItem('lostPets', JSON.stringify(reports));
        
        return reports[reportIndex];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostPets'] });
    },
  });

  // Helper functions
  const createLostPetReport = (report: Omit<LostPetReport, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => {
    return createReportMutation.mutateAsync(report);
  };

  const respondToReport = (reportId: string, response: Omit<LostPetResponse, 'id' | 'createdAt' | 'reportId'>) => {
    return respondToReportMutation.mutateAsync({ reportId, response });
  };

  const updateReportStatus = (reportId: string, status: LostPetReport['status']) => {
    return updateReportStatusMutation.mutateAsync({ reportId, status });
  };

  const applyFilters = (filters: LostPetFilter) => {
    setActiveFilters(filters);
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  // Get nearby reports based on user location
  const getNearbyReports = (maxDistance: number = 10) => {
    if (!userLocation || !lostPetsQuery.data) return [];
    
    return lostPetsQuery.data.filter(report => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.lastSeenLocation.latitude,
        report.lastSeenLocation.longitude
      );
      return distance <= maxDistance;
    });
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return {
    // Data
    lostPets: lostPetsQuery.data || [],
    isLoading: lostPetsQuery.isLoading,
    error: lostPetsQuery.error,
    activeFilters,
    userLocation,
    
    // Actions
    createLostPetReport,
    respondToReport,
    updateReportStatus,
    applyFilters,
    clearFilters,
    setUserLocation,
    getNearbyReports,
    
    // Mutations
    isCreating: createReportMutation.isPending,
    isResponding: respondToReportMutation.isPending,
    isUpdating: updateReportStatusMutation.isPending,
  };
});