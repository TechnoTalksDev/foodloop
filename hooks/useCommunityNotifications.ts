import { useCallback } from "react";
import { useNotifications } from "@/context/notification-provider";
import { addDays } from "date-fns";

export const useCommunityNotifications = () => {
	const { addNotification } = useNotifications();

	// Notify when someone replies to a post
	const notifyPostReply = useCallback(
		(data: {
			postId: number;
			postTitle: string;
			replyContent: string;
			authorName: string;
		}) => {
			addNotification({
				type: "community_reply",
				title: `💬 New reply to your post`,
				message: `${data.authorName} replied to "${data.postTitle}": ${
					data.replyContent.length > 50
						? data.replyContent.substring(0, 50) + "..."
						: data.replyContent
				}`,
				data: {
					post_id: data.postId,
					author_name: data.authorName,
					post_title: data.postTitle,
				},
				urgent: false,
				action_url: `/(protected)/post/${data.postId}`,
				icon: "💬",
				expires_at: addDays(new Date(), 7).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify when someone upvotes a post
	const notifyPostUpvote = useCallback(
		(data: {
			postId: number;
			postTitle: string;
			voterName: string;
			totalUpvotes: number;
		}) => {
			addNotification({
				type: "community_vote",
				title: `👍 ${data.voterName} upvoted your post!`,
				message: `"${data.postTitle}" now has ${data.totalUpvotes} upvotes.`,
				data: {
					post_id: data.postId,
					voter_name: data.voterName,
					upvotes: data.totalUpvotes,
					post_title: data.postTitle,
				},
				urgent: false,
				action_url: `/(protected)/post/${data.postId}`,
				icon: "👍",
				expires_at: addDays(new Date(), 3).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify when someone joins a group you created
	const notifyGroupJoin = useCallback(
		(data: {
			groupId: number;
			groupName: string;
			memberName: string;
			totalMembers: number;
		}) => {
			addNotification({
				type: "group_join",
				title: `👥 New member joined ${data.groupName}!`,
				message: `${data.memberName} just joined your group. You now have ${data.totalMembers} members.`,
				data: {
					group_id: data.groupId,
					member_name: data.memberName,
					member_count: data.totalMembers,
					group_name: data.groupName,
				},
				urgent: false,
				action_url: `/(protected)/groups/${data.groupId}`,
				icon: "👥",
				expires_at: addDays(new Date(), 5).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify about new post in joined group
	const notifyGroupPost = useCallback(
		(data: {
			postId: number;
			postTitle: string;
			groupName: string;
			authorName: string;
		}) => {
			addNotification({
				type: "group_update",
				title: `📝 New post in ${data.groupName}`,
				message: `${data.authorName} posted: "${data.postTitle}"`,
				data: {
					post_id: data.postId,
					group_name: data.groupName,
					author_name: data.authorName,
					post_title: data.postTitle,
				},
				urgent: false,
				action_url: `/(protected)/post/${data.postId}`,
				icon: "📝",
				expires_at: addDays(new Date(), 5).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify about trending/popular post
	const notifyTrendingPost = useCallback(
		(data: {
			postId: number;
			postTitle: string;
			authorName: string;
			upvotes: number;
		}) => {
			addNotification({
				type: "community_post",
				title: `🔥 Trending post: "${data.postTitle}"`,
				message: `${data.authorName}'s post is getting lots of attention with ${data.upvotes} upvotes!`,
				data: {
					post_id: data.postId,
					author_name: data.authorName,
					upvotes: data.upvotes,
					post_title: data.postTitle,
				},
				urgent: false,
				action_url: `/(protected)/post/${data.postId}`,
				icon: "🔥",
				expires_at: addDays(new Date(), 2).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify about achievement unlocked
	const notifyAchievement = useCallback(
		(data: {
			achievementTitle: string;
			achievementDescription: string;
			achievementIcon?: string;
		}) => {
			addNotification({
				type: "achievement",
				title: `🏆 Achievement Unlocked!`,
				message: `${data.achievementTitle}: ${data.achievementDescription}`,
				data: {
					achievement_title: data.achievementTitle,
					achievement_description: data.achievementDescription,
				},
				urgent: false,
				action_url: `/(protected)/(tabs)/profile`,
				icon: data.achievementIcon || "🏆",
				expires_at: addDays(new Date(), 30).toISOString(),
			});
		},
		[addNotification],
	);

	// Notify about community milestone
	const notifyCommunityMilestone = useCallback(
		(data: { milestone: string; description: string }) => {
			addNotification({
				type: "community_post",
				title: `🎉 Community Milestone!`,
				message: `${data.milestone}: ${data.description}`,
				data: {
					milestone: data.milestone,
					description: data.description,
				},
				urgent: false,
				action_url: `/(protected)/(tabs)/community`,
				icon: "🎉",
				expires_at: addDays(new Date(), 7).toISOString(),
			});
		},
		[addNotification],
	);

	return {
		notifyPostReply,
		notifyPostUpvote,
		notifyGroupJoin,
		notifyGroupPost,
		notifyTrendingPost,
		notifyAchievement,
		notifyCommunityMilestone,
	};
};
