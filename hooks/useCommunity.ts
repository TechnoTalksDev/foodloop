import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import {
	Group,
	Post,
	PostReply,
	CreateGroupData,
	CreatePostData,
	CreateReplyData,
} from "@/types/community";

// Groups hooks
export const useGroups = (filters?: {
	category?: string;
	featured?: boolean;
}) => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchGroups = async () => {
		try {
			setLoading(true);
			let query = supabase
				.from("groups")
				.select(
					`
          *,
          creator:users!groups_creator_id_fkey(id, name, username, avatar)
        `,
				)
				.eq("is_public", true)
				.order("member_count", { ascending: false });

			if (filters?.category) {
				query = query.eq("category", filters.category);
			}

			if (filters?.featured) {
				query = query.eq("is_featured", true);
			}

			const { data, error } = await query;

			if (error) throw error;
			setGroups(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching groups");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGroups();
	}, [filters?.category, filters?.featured]);

	return { groups, loading, error, refetch: fetchGroups };
};

export const useGroup = (groupId: number) => {
	const [group, setGroup] = useState<Group | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchGroup = async () => {
		try {
			setLoading(true);

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { data, error } = await supabase
				.from("groups")
				.select(
					`
          *,
          creator:users!groups_creator_id_fkey(id, name, username, avatar)
        `,
				)
				.eq("id", groupId)
				.single();

			if (error) throw error;

			// Check if current user is a member
			let is_member = false;
			if (user) {
				const { data: memberData } = await supabase
					.from("group_members")
					.select("id")
					.eq("group_id", groupId)
					.eq("user_id", user.id)
					.eq("is_active", true)
					.single();

				is_member = !!memberData;
			}

			setGroup({ ...data, is_member });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching group");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (groupId) {
			fetchGroup();
		}
	}, [groupId]);

	return { group, loading, error, refetch: fetchGroup };
};

export const useCreateGroup = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createGroup = async (data: CreateGroupData): Promise<Group | null> => {
		try {
			setLoading(true);
			setError(null);

			const { data: user } = await supabase.auth.getUser();
			if (!user.user) throw new Error("User not authenticated");

			const { data: newGroup, error } = await supabase
				.from("groups")
				.insert({
					...data,
					creator_id: user.user.id,
				})
				.select(
					`
          *,
          creator:users!groups_creator_id_fkey(id, name, username, avatar)
        `,
				)
				.single();

			if (error) throw error;

			// Add creator as member
			await supabase.from("group_members").insert({
				group_id: newGroup.id,
				user_id: user.user.id,
				role: "admin",
			});

			return newGroup;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error creating group");
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { createGroup, loading, error };
};

// Posts hooks
export const usePosts = (filters?: { groupId?: number; postType?: string }) => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPosts = async () => {
		try {
			setLoading(true);

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			let query = supabase
				.from("posts")
				.select(
					`
          *,
          author:users!posts_author_id_fkey(id, name, username, avatar),
          group:groups!posts_group_id_fkey(id, name, category)
        `,
				)
				.order("created_at", { ascending: false });

			if (filters?.groupId) {
				query = query.eq("group_id", filters.groupId);
			}

			if (filters?.postType) {
				query = query.eq("post_type", filters.postType);
			}

			const { data, error } = await query;

			if (error) throw error;

			// Get user votes for all posts if user is authenticated
			let postsWithVotes = data || [];
			if (user && data) {
				const postIds = data.map((p) => p.id);
				const { data: votes } = await supabase
					.from("post_votes")
					.select("post_id, vote_type")
					.eq("user_id", user.id)
					.in("post_id", postIds);

				postsWithVotes = data.map((post) => {
					const userVote = votes?.find((v) => v.post_id === post.id);
					return {
						...post,
						user_vote: userVote?.vote_type || null,
					};
				});
			}

			setPosts(postsWithVotes);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching posts");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPosts();
	}, [filters?.groupId, filters?.postType]);

	return { posts, loading, error, refetch: fetchPosts };
};

// Popular posts hook - top 3 by view count
export const usePopularPosts = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPopularPosts = async () => {
		try {
			setLoading(true);

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { data, error } = await supabase
				.from("posts")
				.select(
					`
          *,
          author:users!posts_author_id_fkey(id, name, username, avatar),
          group:groups!posts_group_id_fkey(id, name, category)
        `,
				)
				.order("view_count", { ascending: false })
				.limit(3);

			if (error) throw error;

			// Get user votes for all posts if user is authenticated
			let postsWithVotes = data || [];
			if (user && data) {
				const postIds = data.map((p) => p.id);
				const { data: votes } = await supabase
					.from("post_votes")
					.select("post_id, vote_type")
					.eq("user_id", user.id)
					.in("post_id", postIds);

				postsWithVotes = data.map((post) => {
					const userVote = votes?.find((v) => v.post_id === post.id);
					return {
						...post,
						user_vote: userVote?.vote_type || null,
					};
				});
			}

			setPosts(postsWithVotes);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error fetching popular posts",
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPopularPosts();
	}, []);

	return { posts, loading, error, refetch: fetchPopularPosts };
};

// Popular groups hook - top 3 by member count
export const usePopularGroups = () => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPopularGroups = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("groups")
				.select(
					`
          *,
          creator:users!groups_creator_id_fkey(id, name, username, avatar)
        `,
				)
				.eq("is_public", true)
				.order("member_count", { ascending: false })
				.limit(3);

			if (error) throw error;
			setGroups(data || []);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error fetching popular groups",
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPopularGroups();
	}, []);

	return { groups, loading, error, refetch: fetchPopularGroups };
};

export const usePost = (postId: number) => {
	const [post, setPost] = useState<Post | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPost = async () => {
		try {
			setLoading(true);

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { data, error } = await supabase
				.from("posts")
				.select(
					`
          *,
          author:users!posts_author_id_fkey(id, name, username, avatar),
          group:groups!posts_group_id_fkey(id, name, category)
        `,
				)
				.eq("id", postId)
				.single();

			if (error) throw error;

			// Check if current user has voted on this post
			let user_vote = null;
			if (user) {
				const { data: voteData } = await supabase
					.from("post_votes")
					.select("vote_type")
					.eq("post_id", postId)
					.eq("user_id", user.id)
					.single();

				user_vote = voteData?.vote_type || null;
			}

			setPost({ ...data, user_vote });

			// Increment view count
			await supabase
				.from("posts")
				.update({ view_count: (data.view_count || 0) + 1 })
				.eq("id", postId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching post");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (postId) {
			fetchPost();
		}
	}, [postId]);

	return { post, loading, error, refetch: fetchPost };
};

export const useCreatePost = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createPost = async (data: CreatePostData): Promise<Post | null> => {
		try {
			setLoading(true);
			setError(null);

			const { data: user } = await supabase.auth.getUser();
			if (!user.user) throw new Error("User not authenticated");

			const { data: newPost, error } = await supabase
				.from("posts")
				.insert({
					...data,
					author_id: user.user.id,
					post_type: data.post_type || "discussion",
				})
				.select(
					`
          *,
          author:users!posts_author_id_fkey(id, name, username, avatar),
          group:groups!posts_group_id_fkey(id, name, category)
        `,
				)
				.single();

			if (error) throw error;

			// Update group post count if posting to a group
			if (data.group_id) {
				await supabase.rpc("increment_group_post_count", {
					group_id: data.group_id,
				});
			}

			return newPost;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error creating post");
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { createPost, loading, error };
};

// Post voting
export const usePostVoting = () => {
	const [loading, setLoading] = useState(false);

	const votePost = async (
		postId: number,
		voteType: "up" | "down",
	): Promise<boolean> => {
		try {
			setLoading(true);
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) return false;

			// Check if user already voted
			const { data: existingVote } = await supabase
				.from("post_votes")
				.select("*")
				.eq("user_id", user.user.id)
				.eq("post_id", postId)
				.single();

			if (existingVote) {
				if (existingVote.vote_type === voteType) {
					// Remove vote if same vote type
					await supabase.from("post_votes").delete().eq("id", existingVote.id);
				} else {
					// Update vote type
					await supabase
						.from("post_votes")
						.update({ vote_type: voteType })
						.eq("id", existingVote.id);
				}
			} else {
				// Create new vote
				await supabase.from("post_votes").insert({
					user_id: user.user.id,
					post_id: postId,
					vote_type: voteType,
				});
			}

			// Fallback: manually sync vote counts if trigger doesn't work
			await supabase.rpc("sync_post_vote_counts", { post_id_param: postId });

			return true;
		} catch (err) {
			console.error("Error voting on post:", err);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { votePost, loading };
};

// Reply voting
export const useReplyVoting = () => {
	const [loading, setLoading] = useState(false);

	const voteReply = async (
		replyId: number,
		voteType: "up" | "down",
	): Promise<boolean> => {
		try {
			setLoading(true);
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) return false;

			// Check if user already voted
			const { data: existingVote } = await supabase
				.from("post_votes")
				.select("*")
				.eq("user_id", user.user.id)
				.eq("reply_id", replyId)
				.single();

			if (existingVote) {
				if (existingVote.vote_type === voteType) {
					// Remove vote if same vote type
					await supabase.from("post_votes").delete().eq("id", existingVote.id);
				} else {
					// Update vote type
					await supabase
						.from("post_votes")
						.update({ vote_type: voteType })
						.eq("id", existingVote.id);
				}
			} else {
				// Create new vote
				await supabase.from("post_votes").insert({
					user_id: user.user.id,
					reply_id: replyId,
					vote_type: voteType,
				});
			}

			// Fallback: manually sync vote counts if trigger doesn't work
			await supabase.rpc("sync_reply_vote_counts");

			return true;
		} catch (err) {
			console.error("Error voting on reply:", err);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { voteReply, loading };
};

// Post replies
export const usePostReplies = (postId: number) => {
	const [replies, setReplies] = useState<PostReply[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchReplies = async () => {
		try {
			setLoading(true);

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { data, error } = await supabase
				.from("post_replies")
				.select(
					`
          *,
          author:users!post_replies_author_id_fkey(id, name, username, avatar)
        `,
				)
				.eq("post_id", postId)
				.eq("is_deleted", false)
				.order("created_at", { ascending: true });

			if (error) throw error;

			// Get user votes for all replies if user is authenticated
			let repliesWithVotes = data || [];
			if (user && data) {
				const replyIds = data.map((r) => r.id);
				const { data: votes } = await supabase
					.from("post_votes")
					.select("reply_id, vote_type")
					.eq("user_id", user.id)
					.in("reply_id", replyIds);

				repliesWithVotes = data.map((reply) => {
					const userVote = votes?.find((v) => v.reply_id === reply.id);
					return {
						...reply,
						user_vote: userVote?.vote_type || null,
					};
				});
			}

			setReplies(repliesWithVotes);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching replies");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (postId) {
			fetchReplies();
		}
	}, [postId]);

	return { replies, loading, error, refetch: fetchReplies };
};

export const useCreateReply = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createReply = async (
		data: CreateReplyData,
	): Promise<PostReply | null> => {
		try {
			setLoading(true);
			setError(null);

			const { data: user } = await supabase.auth.getUser();
			if (!user.user) throw new Error("User not authenticated");

			const { data: newReply, error } = await supabase
				.from("post_replies")
				.insert({
					...data,
					author_id: user.user.id,
				})
				.select(
					`
          *,
          author:users!post_replies_author_id_fkey(id, name, username, avatar)
        `,
				)
				.single();
			if (error) throw error;

			// Reply count will be updated automatically by the database trigger

			return newReply;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error creating reply");
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { createReply, loading, error };
};

// Group membership
export const useJoinGroup = () => {
	const [loading, setLoading] = useState(false);

	const joinGroup = async (groupId: number): Promise<boolean> => {
		try {
			setLoading(true);
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) return false;

			const { error } = await supabase.from("group_members").insert({
				group_id: groupId,
				user_id: user.user.id,
				role: "member",
			});

			if (error) throw error;

			// Member count is automatically updated by the database trigger
			return true;
		} catch (err) {
			console.error("Error joining group:", err);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const leaveGroup = async (groupId: number): Promise<boolean> => {
		try {
			setLoading(true);
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) return false;

			const { error } = await supabase
				.from("group_members")
				.delete()
				.eq("group_id", groupId)
				.eq("user_id", user.user.id);

			if (error) throw error;

			// Member count is automatically updated by the database trigger
			return true;
		} catch (err) {
			console.error("Error leaving group:", err);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { joinGroup, leaveGroup, loading };
};
