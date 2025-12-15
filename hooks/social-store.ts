import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService, lostFoundService } from '@/services/database';
import { Post, Comment, User } from '@/types';
import { useFirebaseUser } from './firebase-user-store';
import { useUser } from './user-store';
import { StorageService } from '@/services/storage';

export const [SocialContext, useSocial] = createContextHook(() => {
  const { user: firebaseUser } = useFirebaseUser();
  const { user: mockUser } = useUser();
  const queryClient = useQueryClient();
  
  // Use Firebase user if available, otherwise fall back to mock user
  const user = firebaseUser || mockUser;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Social Store - Auth Status:', {
      firebaseUser: firebaseUser ? { id: firebaseUser.id, name: firebaseUser.name } : null,
      mockUser: mockUser ? { id: mockUser.id, name: mockUser.name } : null,
      finalUser: user ? { id: user.id, name: user.name } : null
    });
  }, [firebaseUser, mockUser, user]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Get posts feed
  const postsQuery = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async () => {
      const [posts, lostReports] = await Promise.all([
        databaseService.post.getPostsFeed(),
        databaseService.lostFound.listReports().catch(() => [])
      ]);

      const mappedLost: Post[] = (lostReports as any[]).map((r: any) => {
        const createdAt = (r?.createdAt as any)?.toDate?.() || new Date();
        const authorName = r?.reporterName || r?.authorName || 'Anonyme';
        const image = r?.photo || r?.imageUrl || undefined;
        const petName = r?.petName || r?.animalName || 'Animal';
        const content = r?.description || `Animal perdu: ${petName}`;
        const loc = r?.location && r.location.latitude && r.location.longitude ? {
          name: r?.address || r?.city || undefined,
          latitude: Number(r.location.latitude),
          longitude: Number(r.location.longitude)
        } : undefined;
        return {
          id: `lost-${String(r.id)}`,
          authorId: String(r?.userId ?? r?.authorId ?? 'unknown'),
          authorName: String(authorName),
          authorPhoto: r?.authorPhoto || undefined,
          content: String(content),
          images: image ? [String(image)] : undefined,
          petId: r?.petId ? String(r.petId) : undefined,
          location: loc as any,
          likesCount: 0,
          commentsCount: 0,
          createdAt,
          updatedAt: createdAt,
          tags: Array.isArray(r?.tags) ? r.tags : undefined,
          type: 'lost',
        } as Post;
      });

      return [...mappedLost, ...posts];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Update posts when query data changes
  useEffect(() => {
    if (postsQuery.data) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  // Load liked posts for current user
  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!user || !posts.length) return;
      
      try {
        const likedPostIds = new Set<string>();
        
        // Check which posts are liked by current user
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

  // Create post mutation
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
      // Refetch posts after creating a new one
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      console.log('✅ Post created successfully');
    },
    onError: (error) => {
      console.error('❌ Error creating post:', error);
    }
  });

  // Like/Unlike post mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      return await databaseService.post.toggleLike(postId, user.id);
    },
    onMutate: async ({ postId }) => {
      // Optimistic update
      const isCurrentlyLiked = likedPosts.has(postId);
      
      // Update liked posts set
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      // Update posts array
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
      
      // Revert optimistic update
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
      // Update with server response
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

  // Add comment mutation
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
      // Update post comments count
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );
      
      // Invalidate comments query for this post
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      console.log('✅ Comment added successfully');
    },
    onError: (error) => {
      console.error('❌ Error adding comment:', error);
    }
  });

  // Get comments for a post
  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      return await databaseService.comment.getComments(postId);
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return [];
    }
  }, []);

  // Get user posts
  const getUserPosts = useCallback(async (userId: string): Promise<Post[]> => {
    try {
      return await databaseService.post.getPostsByUser(userId);
    } catch (error) {
      console.error('❌ Error getting user posts:', error);
      return [];
    }
  }, []);

  // Real-time posts listener
  useEffect(() => {
    if (!user) return;
    
    console.log('🔄 Setting up real-time posts listener');
    
    const unsubscribe = databaseService.realtime.listenToPostsFeed((newPosts) => {
      console.log('📡 Received real-time posts update:', newPosts.length);
      setPosts((prev) => {
        const lostOnes = prev.filter(p => p.type === 'lost');
        const merged = [...lostOnes, ...newPosts];
        return merged;
      });
    });
    
    return unsubscribe;
  }, [user]);

  // Create post function
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

  // Toggle like function
  const toggleLike = async (postId: string) => {
    return toggleLikeMutation.mutateAsync({ postId });
  };

  // Add comment function
  const addComment = async (postId: string, content: string) => {
    return addCommentMutation.mutateAsync({ postId, content });
  };

  // Check if post is liked
  const isPostLiked = (postId: string): boolean => {
    return likedPosts.has(postId);
  };

  // Refresh posts
  const refreshPosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  return {
    posts,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
    createPost,
    toggleLike,
    addComment,
    getComments,
    getUserPosts,
    isPostLiked,
    refreshPosts,
    isCreatingPost: createPostMutation.isPending,
    isTogglingLike: toggleLikeMutation.isPending,
    isAddingComment: addCommentMutation.isPending
  };
});