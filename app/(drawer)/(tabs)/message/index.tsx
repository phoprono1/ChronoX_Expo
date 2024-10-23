import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { areFriends, getFriendsList, updateFollowStatus } from "@/constants/AppwriteFollow";
import { Avatar } from "react-native-ui-lib";
import { client } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { router } from "expo-router";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { Ionicons } from "@expo/vector-icons";

// Cập nhật interface Followed
interface Followed {
  $id: string;
  accountID: string;
  avatarId: string | null;
  bio: string | null;
  email: string;
  followed: number;
  follower: number;
  location: string | null;
  username: string;
  website: string | null;
  status: string;
  isOnline: boolean; // Thay đổi này
  lastMessage?: string;
  lastMessageTime?: string;
}

const Message = () => {
  const { isVisible } = useBottomSheet();
  const scale = useSharedValue(1);
  const user = useSelector((state: any) => state.currentUser);
  const [userInfo, setUserInfo] = useState(user);
  const [friendsList, setFriendsList] = useState<Followed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFriends = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const friends = await getFriendsList(userInfo.$id);
      const followedList = friends.map((friend: any) => ({
        ...friend.followed,
        isOnline: friend.followed.status === "online",
      }));
      setFriendsList(followedList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      setError("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUserInfo(user);
    if (user.$id) {
      fetchFriends(); // Gọi fetchFriends ngay khi userInfo được cập nhật
    }
  }, [user]);

  useEffect(() => {
    if (!userInfo.$id) return;

    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const updatedUser = JSON.parse(JSON.stringify(response.payload));
        
        // Kiểm tra xem có sự thay đổi trong followed hoặc follower không
        if (updatedUser.followed !== undefined || updatedUser.follower !== undefined) {
          // Nếu có, kiểm tra xem userInfo và updatedUser có phải là bạn bè không
          const areTheyFriends = await updateFollowStatus(userInfo.$id, updatedUser.$id);

          if (areTheyFriends) {
            // Nếu là bạn bè, cập nhật danh sách bạn bè
            setFriendsList((prevList) => {
              const existingFriend = prevList.find(friend => friend.$id === updatedUser.$id);
              if (existingFriend) {
                // Cập nhật thông tin bạn bè hiện có
                return prevList.map(friend => 
                  friend.$id === updatedUser.$id 
                    ? { ...friend, ...updatedUser, isOnline: updatedUser.status === "online" }
                    : friend
                );
              } else {
                // Thêm bạn mới vào danh sách
                return [...prevList, { ...updatedUser, isOnline: updatedUser.status === "online" }];
              }
            });
          } else {
            // Nếu không còn là bạn bè, xóa khỏi danh sách
            setFriendsList((prevList) => prevList.filter(friend => friend.$id !== updatedUser.$id));
          }
        } else {
          // Nếu chỉ có sự thay đổi trong trạng thái online/offline
          setFriendsList((prevList) =>
            prevList.map((friend) =>
              friend.$id === updatedUser.$id
                ? { ...friend, isOnline: updatedUser.status === "online" }
                : friend
            )
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userInfo.$id]);

  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.9 : 1, { duration: 200 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleChat = (userId: string) => {
    router.push({
      pathname: "../../(functions)/chat/[chat]",
      params: { userInfoId: userId, currentUserId: userInfo.$id },
    });
  };

  const renderStoryItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity className="items-center mr-4">
      <View className="relative">
        <Avatar
          source={{ uri: getAvatarUrl(item.avatarId!!) || undefined }}
          size={60}
        />
        <View
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            item.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </View>
      <Text className="text-center mt-1 text-xs font-medium" numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity
      className="bg-white flex-row items-center p-4 border-b border-gray-100"
      onPress={() => handleChat(item.$id)}
    >
      <View className="relative">
        <Avatar
          source={{ uri: getAvatarUrl(item.avatarId!!) || undefined }}
          size={56}
        />
        <View
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
            item.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-semibold text-base">{item.username}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {item.lastMessage || "Bắt đầu cuộc trò chuyện"}
        </Text>
      </View>
      <View className="items-end">
        {item.lastMessageTime && (
          <Text className="text-xs text-gray-400 mb-1">
            {item.lastMessageTime}
          </Text>
        )}
        <View className="bg-purple-500 rounded-full w-6 h-6 items-center justify-center">
          <Text className="text-white text-xs font-bold">3</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFriends();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="max-h-24 mb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-4 pb-2"
        >
          {friendsList.map((friend) => (
            <React.Fragment key={friend.$id}>
              {renderStoryItem({ item: friend })}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <FlatList
          data={friendsList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.$id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 text-base">
                Không có cuộc trò chuyện nào
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Message;
