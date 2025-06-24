export interface Group {
  id: number;
  created_at: string;
  updated_at: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: string;
  subcategory: string | null;
  location: string | null;
  location_radius: number | null;
  creator_id: string;
  member_count: number;
  post_count: number;
  is_public: boolean;
  is_featured: boolean;
  rules: string | null;
  tags: string[] | null;
  creator?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  is_member?: boolean;
}

export interface Post {
  id: number;
  created_at: string;
  updated_at: string | null;
  author_id: string;
  group_id: number | null;
  title: string;
  content: string;
  post_type: string;
  tags: string[] | null;
  images: string[] | null;
  upvotes: number;
  downvotes: number;
  reply_count: number;
  view_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  location: string | null;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  group?: {
    id: number;
    name: string;
    category: string;
  };
  user_vote?: 'up' | 'down' | null;
}

export interface PostReply {
  id: number;
  created_at: string;
  updated_at: string | null;
  post_id: number;
  author_id: string;
  parent_reply_id: number | null;
  content: string;
  images: string[] | null;
  upvotes: number;
  downvotes: number;
  is_accepted: boolean;
  is_deleted: boolean;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  user_vote?: 'up' | 'down' | null;
}

export interface GroupMember {
  id: number;
  created_at: string;
  group_id: number;
  user_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface PostVote {
  id: number;
  created_at: string;
  user_id: string;
  post_id: number | null;
  reply_id: number | null;
  vote_type: 'up' | 'down';
}

export interface CreateGroupData {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  location?: string;
  location_radius?: number;
  is_public?: boolean;
  rules?: string;
  tags?: string[];
  icon?: string;
  color?: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  group_id?: number;
  post_type?: string;
  tags?: string[];
  images?: string[];
  location?: string;
}

export interface CreateReplyData {
  post_id: number;
  content: string;
  parent_reply_id?: number;
  images?: string[];
}
