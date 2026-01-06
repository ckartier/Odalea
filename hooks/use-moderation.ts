import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModerationService } from '@/services/moderation';
import { ReportReason, ReportTargetType } from '@/types';
import { auth } from '@/services/firebase';

export function useModeration() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  const userFlagsQuery = useQuery({
    queryKey: ['moderation', 'userFlags', userId],
    queryFn: () => userId ? ModerationService.getUserFlags(userId) : null,
    enabled: !!userId,
    staleTime: 60000,
  });

  const isUserBannedQuery = useQuery({
    queryKey: ['moderation', 'isBanned', userId],
    queryFn: () => userId ? ModerationService.isUserBanned(userId) : false,
    enabled: !!userId,
    staleTime: 30000,
  });

  const reportMutation = useMutation({
    mutationFn: ({
      targetType,
      targetId,
      reason,
      details,
    }: {
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      details?: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');
      const userName = auth.currentUser?.displayName || 'Utilisateur';
      return ModerationService.createReport(userId, userName, targetType, targetId, reason, details);
    },
    onSuccess: () => {
      console.log('✅ Report submitted successfully');
    },
  });

  const checkRateLimitMutation = useMutation({
    mutationFn: (action: 'post' | 'report') => {
      if (!userId) return Promise.resolve(true);
      return ModerationService.checkRateLimit(userId, action);
    },
  });

  const { mutateAsync: reportAsync } = reportMutation;
  const { mutateAsync: checkRateLimitAsync } = checkRateLimitMutation;

  const reportPost = useCallback(
    async (postId: string, reason: ReportReason, details?: string) => {
      const canReport = await checkRateLimitAsync('report');
      if (!canReport) {
        throw new Error('Vous avez atteint la limite de signalements. Réessayez plus tard.');
      }
      return reportAsync({
        targetType: 'post',
        targetId: postId,
        reason,
        details,
      });
    },
    [reportAsync, checkRateLimitAsync]
  );

  const reportComment = useCallback(
    async (commentId: string, reason: ReportReason, details?: string) => {
      const canReport = await checkRateLimitAsync('report');
      if (!canReport) {
        throw new Error('Vous avez atteint la limite de signalements. Réessayez plus tard.');
      }
      return reportAsync({
        targetType: 'comment',
        targetId: commentId,
        reason,
        details,
      });
    },
    [reportAsync, checkRateLimitAsync]
  );

  const reportUser = useCallback(
    async (targetUserId: string, reason: ReportReason, details?: string) => {
      const canReport = await checkRateLimitAsync('report');
      if (!canReport) {
        throw new Error('Vous avez atteint la limite de signalements. Réessayez plus tard.');
      }
      return reportAsync({
        targetType: 'user',
        targetId: targetUserId,
        reason,
        details,
      });
    },
    [reportAsync, checkRateLimitAsync]
  );

  const canPost = useCallback(async () => {
    if (!userId) return false;
    return checkRateLimitAsync('post');
  }, [userId, checkRateLimitAsync]);

  return {
    userFlags: userFlagsQuery.data,
    isBanned: isUserBannedQuery.data ?? false,
    strikes: userFlagsQuery.data?.strikes ?? 0,
    isLoading: userFlagsQuery.isLoading || isUserBannedQuery.isLoading,
    isReporting: reportMutation.isPending,

    reportPost,
    reportComment,
    reportUser,
    canPost,

    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  };
}

export function useModerationAdmin() {
  const queryClient = useQueryClient();

  const pendingReportsQuery = useQuery({
    queryKey: ['moderation', 'pendingReports'],
    queryFn: () => ModerationService.getPendingReports(50),
    staleTime: 30000,
  });

  const hideContentMutation = useMutation({
    mutationFn: ({
      targetType,
      targetId,
      actorId,
      reason,
    }: {
      targetType: ReportTargetType;
      targetId: string;
      actorId: string;
      reason: string;
    }) => ModerationService.hideContent(targetType, targetId, actorId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  const approveContentMutation = useMutation({
    mutationFn: ({
      targetType,
      targetId,
      actorId,
    }: {
      targetType: ReportTargetType;
      targetId: string;
      actorId: string;
    }) => ModerationService.approveContent(targetType, targetId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({
      userId,
      actorId,
      reason,
      durationDays,
    }: {
      userId: string;
      actorId: string;
      reason: string;
      durationDays?: number;
    }) => ModerationService.banUser(userId, actorId, reason, durationDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: ({ userId, actorId }: { userId: string; actorId: string }) =>
      ModerationService.unbanUser(userId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  return {
    pendingReports: pendingReportsQuery.data ?? [],
    isLoading: pendingReportsQuery.isLoading,

    hideContent: hideContentMutation.mutate,
    approveContent: approveContentMutation.mutate,
    banUser: banUserMutation.mutate,
    unbanUser: unbanUserMutation.mutate,

    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'pendingReports'] });
    },
  };
}

export const REPORT_REASONS: { key: ReportReason; label: string; description: string }[] = [
  { key: 'spam', label: 'Spam', description: 'Publicité ou contenu répétitif non sollicité' },
  { key: 'harassment', label: 'Harcèlement', description: 'Comportement abusif ou intimidant' },
  { key: 'hate_speech', label: 'Discours haineux', description: 'Propos discriminatoires ou haineux' },
  { key: 'violence', label: 'Violence', description: 'Contenu violent ou menaçant' },
  { key: 'sexual_content', label: 'Contenu sexuel', description: 'Contenu sexuel ou nudité non appropriée' },
  { key: 'false_info', label: 'Désinformation', description: 'Fausses informations ou tromperie' },
  { key: 'child_safety', label: 'Sécurité des mineurs', description: 'Contenu impliquant des mineurs' },
  { key: 'self_harm', label: 'Automutilation', description: 'Contenu promouvant l\'automutilation' },
  { key: 'other', label: 'Autre', description: 'Autre raison non listée' },
];
