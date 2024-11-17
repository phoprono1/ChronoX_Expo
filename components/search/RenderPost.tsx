import React from "react";
import PostCard from "../cards/PostCard";
import { View } from "react-native";

interface RenderPostProps {
  post: {
    $id: string;
    avatar: string;
    username: string;
    email: string;
    fileIds: string[];
    title: string;
    hashtags: string[];
    likes: number;
    comments: number;
    isLiked: boolean;
  };
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onTitlePress: () => void;
  onHashtagPress: () => void;
  onUserInfoPress: () => void;
}

const RenderPost: React.FC<RenderPostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onTitlePress,
  onHashtagPress,
  onUserInfoPress,
}) => {
  return (
    <View className=" p-2 bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <PostCard
        avatar={post.avatar}
        username={post.username}
        email={post.email}
        fileIds={post.fileIds}
        title={post.title}
        hashtags={post.hashtags}
        likes={post.likes}
        comments={post.comments}
        isLiked={post.isLiked}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onTitlePress={onTitlePress}
        onHashtagPress={onHashtagPress}
        onUserInfoPress={onUserInfoPress}
      />
    </View>
  );
};

export default RenderPost;
