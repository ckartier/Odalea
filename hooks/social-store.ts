import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '@/services/database';
import { Post, Comment } from '@/types';
import { useFirebaseUser } from './firebase-user-store';
import { useUser } from './user-store';
import { usePremium } from './premium-store';
import { StorageService } from '@/services/storage';
import { Alert } from 'react-native';

export const [SocialContext, useSocial] = createContextHook(() => {
  const { user: firebaseUser } = useFirebaseUser();
  const { user: mockUser } = useUser();
  const { isPremium, showPremiumPrompt } = usePremium();
  const queryClient = useQueryClient();
  
  const user = firebaseUser || mockUser;
  
  useEffect(() => {
    console.log('🔍 Social Store - Auth Status:', {
      firebaseUser: firebaseUser ? { id: firebaseUser.id, name: firebaseUser.name } : null,
      mockUser: mockUser ? { id: mockUser.id, name: mockUser.name } : null,
      finalUser: user ? { id: user.id, name: user.name } : null
    });
  }, [firebaseUser, mockUser, user]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  const postsQuery = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async () => {
      console.log('🔄 Fetching posts feed with pet data...');
      const [normalPosts, lostReports, challengePosts] = await Promise.all([
        databaseService.post.getPostsFeed(),
        databaseService.lostFound.listReports().catch(() => []),
        databaseService.challenge.getParticipations().catch(() => [])
      ]);
      
      console.log(`📊 Fetched ${normalPosts.length} normal posts, ${lostReports.length} lost/found, ${challengePosts.length} challenges`);

      const mappedLost: Post[] = (lostReports as any[]).map((r: any) => {
        const createdAt = (r?.createdAt as any)?.toDate?.() || new Date();
        const petName = r?.petName || r?.animalName || 'Animal';
        const image = r?.photo || r?.imageUrl || undefined;
        const content = r?.description || `Animal ${r?.type === 'found' ? 'trouvé' : 'perdu'}: ${petName}`;
        const loc = r?.location && r.location.latitude && r.location.longitude ? {
          name: r?.address || r?.city || undefined,
          latitude: Number(r.location.latitude),
          longitude: Number(r.location.longitude)
        } : undefined;
        return {
          id: `lost-${String(r.id)}`,
          authorId: String(r?.userId ?? r?.authorId ?? 'unknown'),
          authorName: String(petName),
          authorPhoto: image,
          fromPetId: r?.petId ? String(r.petId) : undefined,
          fromOwnerId: String(r?.userId ?? r?.authorId ?? 'unknown'),
          content: String(content),
          images: image ? [String(image)] : undefined,
          petId: r?.petId ? String(r.petId) : undefined,
          location: loc as any,
          likesCount: 0,
          commentsCount: 0,
          createdAt,
          updatedAt: createdAt,
          tags: Array.isArray(r?.tags) ? r.tags : undefined,
          type: r?.type === 'found' ? 'found' : 'lost',
          status: r?.status || (r?.type === 'found' ? 'found' : 'lost'),
          reward: r?.reward,
        } as Post;
      });

      const mappedChallenges: Post[] = (challengePosts as any[])
        .filter((p: any) => p.shareInCommunity === true)
        .map((p: any) => {
          const createdAt = p?.submittedAt ? new Date(p.submittedAt) : new Date();
          return {
            id: `challenge-${String(p.id)}`,
            authorId: String(p?.userId || 'unknown'),
            authorName: String(p?.userName || 'Participant'),
            authorPhoto: p?.userPhoto,
            fromPetId: p?.petId ? String(p.petId) : undefined,
            fromOwnerId: String(p?.userId || 'unknown'),
            content: `A relevé le défi : ${p?.challengeTitle || 'Défi'}`,
            images: p?.proof?.type === 'photo' && p?.proof?.data ? [p.proof.data] : undefined,
            likesCount: p?.yesVotes || 0,
            commentsCount: 0,
            createdAt,
            updatedAt: createdAt,
            type: 'challenge',
            challengeId: String(p?.challengeId || ''),
            shareInCommunity: true,
            isPremiumContent: false,
          } as Post;
        });

      const allPosts = [...mappedLost, ...mappedChallenges, ...normalPosts];
      const sorted = allPosts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Extract unique petIds from posts that have fromPetId
      const petIds = Array.from(new Set(
        sorted
          .map(p => p.fromPetId)
          .filter((id): id is string => !!id)
      ));
      
      console.log(`🐾 Found ${petIds.length} unique pets to fetch`);
      
      // Fetch pet data in batch
      if (petIds.length > 0) {
        try {
          const petsMap = await databaseService.pet.getPetsByIds(petIds);
          
          // Enrich posts with pet data
          const enrichedPosts = sorted.map(post => {
            if (post.fromPetId && petsMap.has(post.fromPetId)) {
              const pet = petsMap.get(post.fromPetId)!;
              return {
                ...post,
                authorName: pet.name || 'Animal',
                authorPhoto: pet.mainPhoto || undefined,
              };
            }
            return post;
          });
          
          console.log(`✅ Enriched ${enrichedPosts.length} posts with pet data`);
          return enrichedPosts;
        } catch (error) {
          console.error('❌ Error fetching pet data:', error);
          return sorted;
        }
      }
      
      return sorted;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (postsQuery.data) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!user || !posts.length) return;
      
      try {
        const likedPostIds = new Set<string>();
        
        for (const post of posts) {
          const isLiked = await databaseService.post.isPostLiked(post.id, user.id);
          if (isLiked) {
            likedPostIds.add(post.id);
          }
        }
        
        setLikedPosts(likedPostIds);
      } catch (error) {
        console.error('❌ Error loading liked posts:', error);
      }
    };

    loadLikedPosts();
  }, [user, posts]);

  const createPostMutation = useMutation({
    mutationFn: async (postData: {
      content: string;
      images?: string[];
      petId?: string;
      type: 'text' | 'photo' | 'video' | 'lost' | 'found';
      location?: { name: string; latitude: number; longitude: number };
      tags?: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      if (!isPremium && postData.images && postData.images.length > 1) {
        showPremiumPrompt('gallery');
        throw new Error('Premium required for multiple images');
      }
      
      let uploadedImageUrls: string[] | undefined;
      
      if (postData.images && postData.images.length > 0) {
        console.log('📤 Uploading post images...', postData.images);
        
        const tempPostId = `temp_${Date.now()}`;
        
        try {
          uploadedImageUrls = await Promise.all(
            postData.images.map(async (imageUri, index) => {
              if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
                return imageUri;
              }
              
              return await StorageService.uploadPostImage(
                user.id,
                tempPostId,
                imageUri
              );
            })
          );
          
          console.log('✅ Images uploaded:', uploadedImageUrls);
        } catch (error) {
          console.error('❌ Failed to upload images:', error);
          throw new Error('Failed to upload images');
        }
      }
      
      const post = {
        ...postData,
        images: uploadedImageUrls,
        authorId: user.id,
        authorName: user.name,
        authorPhoto: user.photo,
        likesCount: 0,
        commentsCount: 0
      };
      
      return await databaseService.post.createPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      console.log('✅ Post created successfully');
    },
    onError: (error) => {
      console.error('❌ Error creating post:', error);
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      return await databaseService.post.toggleLike(postId, user.id);
    },
    onMutate: async ({ postId }) => {
      const isCurrentlyLiked = likedPosts.has(postId);
      
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likesCount: isCurrentlyLiked 
                  ? Math.max(0, post.likesCount - 1)
                  : post.likesCount + 1
              }
            : post
        )
      );
      
      return { postId, wasLiked: isCurrentlyLiked };
    },
    onError: (error, { postId }, context) => {
      console.error('❌ Error toggling like:', error);
      
      if (context) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (context.wasLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  likesCount: context.wasLiked 
                    ? post.likesCount + 1
                    : Math.max(0, post.likesCount - 1)
                }
              : post
          )
        );
      }
    },
    onSuccess: ({ liked, likesCount }, { postId }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likesCount }
            : post
        )
      );
      
      console.log(`✅ Post ${liked ? 'liked' : 'unliked'} successfully`);
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const comment = {
        postId,
        authorId: user.id,
        authorName: user.name,
        authorPhoto: user.photo,
        content
      };
      
      return await databaseService.comment.addComment(comment);
    },
    onSuccess: (commentId, { postId }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      console.log('✅ Comment added successfully');
    },
    onError: (error) => {
      console.error('❌ Error adding comment:', error);
    }
  });

  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log(`🚨 Reporting post ${postId} for reason: ${reason}`);
      Alert.alert(
        'Signalement envoyé',
        'Votre signalement a été pris en compte. Notre équipe va le vérifier.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    },
    onError: (error) => {
      console.error('❌ Error reporting post:', error);
      Alert.alert('Erreur', 'Impossible de signaler ce contenu. Veuillez réessayer.');
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log(`🚫 Blocking user ${userId}`);
      setBlockedUsers(prev => new Set(prev).add(userId));
      
      Alert.alert(
        'Utilisateur bloqué',
        'Vous ne verrez plus les publications de cet utilisateur.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('❌ Error blocking user:', error);
      Alert.alert('Erreur', 'Impossible de bloquer cet utilisateur. Veuillez réessayer.');
    }
  });

  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      return await databaseService.comment.getComments(postId);
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return [];
    }
  }, []);

  const getUserPosts = useCallback(async (userId: string): Promise<Post[]> => {
    try {
      return await databaseService.post.getPostsByUser(userId);
    } catch (error) {
      console.error('❌ Error getting user posts:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    console.log('🔄 Setting up real-time posts listener');
    
    const unsubscribe = databaseService.realtime.listenToPostsFeed((newPosts) => {
      console.log('📡 Received real-time posts update:', newPosts.length);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    });
    
    return unsubscribe;
  }, [user, queryClient]);

  const createPost = async (postData: {
    content: string;
    images?: string[];
    petId?: string;
    type?: 'text' | 'photo' | 'video' | 'lost' | 'found';
    location?: { name: string; latitude: number; longitude: number };
    tags?: string[];
  }) => {
    return createPostMutation.mutateAsync({
      type: 'text',
      ...postData
    });
  };

  const toggleLike = async (postId: string) => {
    return toggleLikeMutation.mutateAsync({ postId });
  };

  const addComment = async (postId: string, content: string) => {
    return addCommentMutation.mutateAsync({ postId, content });
  };

  const reportPost = async (postId: string, reason: string) => {
    return reportPostMutation.mutateAsync({ postId, reason });
  };

  const blockUser = async (userId: string) => {
    return blockUserMutation.mutateAsync({ userId });
  };
  
  const deletePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log(`🗑️ Deleting post ${postId}`);
      
      // Delete from Firestore if it's a normal post
      if (!postId.startsWith('lost-') && !postId.startsWith('challenge-')) {
        const { deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/services/firebase');
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
      }
      
      return { postId };
    },
    onSuccess: ({ postId }) => {
      // Remove from local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      console.log('✅ Post deleted successfully');
      Alert.alert('Succès', 'Votre publication a été supprimée.');
    },
    onError: (error) => {
      console.error('❌ Error deleting post:', error);
      Alert.alert('Erreur', 'Impossible de supprimer cette publication.');
    }
  });
  
  const deletePost = async (postId: string) => {
    return deletePostMutation.mutateAsync({ postId });
  };

  const isPostLiked = (postId: string): boolean => {
    return likedPosts.has(postId);
  };

  const refreshPosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const filteredPosts = posts.filter(post => !blockedUsers.has(post.authorId));

  return {
    posts: filteredPosts,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
    createPost,
    toggleLike,
    addComment,
    reportPost,
    blockUser,
    deletePost,
    getComments,
    getUserPosts,
    isPostLiked,
    refreshPosts,
    isCreatingPost: createPostMutation.isPending,
    isTogglingLike: toggleLikeMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isDeletingPost: deletePostMutation.isPending,
    blockedUsers,
  };
});
