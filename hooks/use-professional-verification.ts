import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalVerificationService, VerificationType } from '@/services/professional-verification';
import { auth } from '@/services/firebase';

export function useProfessionalVerification() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  const statusQuery = useQuery({
    queryKey: ['professionalVerification', 'status', userId],
    queryFn: () => professionalVerificationService.getVerificationStatus(userId),
    enabled: !!userId,
    staleTime: 60000,
  });

  const isVerifiedQuery = useQuery({
    queryKey: ['professionalVerification', 'isVerified', userId],
    queryFn: () => professionalVerificationService.isVerified(userId),
    enabled: !!userId,
    staleTime: 60000,
  });

  const submitMutation = useMutation({
    mutationFn: (params: {
      siretNumber?: string;
      companyName: string;
      activityType: string;
      documents: { type: VerificationType; uri: string; fileName: string }[];
    }) => professionalVerificationService.submitVerification(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalVerification'] });
    },
  });

  const validateSiretMutation = useMutation({
    mutationFn: (siret: string) => professionalVerificationService.validateSiret(siret),
  });

  return {
    verification: statusQuery.data,
    isVerified: isVerifiedQuery.data ?? false,
    isLoading: statusQuery.isLoading || isVerifiedQuery.isLoading,
    isSubmitting: submitMutation.isPending,
    
    submitVerification: submitMutation.mutate,
    submitVerificationAsync: submitMutation.mutateAsync,
    validateSiret: validateSiretMutation.mutateAsync,
    
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalVerification'] });
    },
  };
}

export function useProfessionalVerificationAdmin() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['professionalVerification', 'pending'],
    queryFn: () => professionalVerificationService.getPendingVerifications(),
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ verificationId, reviewerId }: { verificationId: string; reviewerId: string }) =>
      professionalVerificationService.approveVerification(verificationId, reviewerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalVerification'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      verificationId,
      reviewerId,
      reason,
    }: {
      verificationId: string;
      reviewerId: string;
      reason: string;
    }) => professionalVerificationService.rejectVerification(verificationId, reviewerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalVerification'] });
    },
  });

  return {
    pendingVerifications: pendingQuery.data ?? [],
    isLoading: pendingQuery.isLoading,
    
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalVerification', 'pending'] });
    },
  };
}
