export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_admin: boolean;
          followers_count: number;
          following_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          color: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string;
          color?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          video_url: string;
          thumbnail_url: string;
          category_id: string | null;
          duration: number;
          views_count: number;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          is_featured: boolean;
          is_published: boolean;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string;
          video_url: string;
          thumbnail_url?: string;
          category_id?: string | null;
          duration?: number;
          views_count?: number;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          is_featured?: boolean;
          is_published?: boolean;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          video_url?: string;
          thumbnail_url?: string;
          category_id?: string | null;
          duration?: number;
          views_count?: number;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          is_featured?: boolean;
          is_published?: boolean;
          tags?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          content: string;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          video_id: string;
          content: string;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          content?: string;
          likes_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id?: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];

export type VideoWithProfile = Video & {
  profiles: Profile;
  categories: Category | null;
};

export type CommentWithProfile = Comment & {
  profiles: Profile;
};
