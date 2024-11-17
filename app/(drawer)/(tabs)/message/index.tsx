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
import { useSelector } from "react-redux";
import { getFriendsList, updateFollowStatus } from "@/constants/AppwriteFollow";
import { Avatar } from "react-native-ui-lib";
import { client } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { router } from "expo-router";
import { getAvatarUrl } from "@/constants/AppwriteFile";

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

  const handleChat = (userId: string) => {
    router.push({
      pathname: "../../../(functions)/chat/[chat]",
      params: { userInfoId: userId, currentUserId: userInfo.$id },
    });
  };

  const renderStoryItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity className="items-center mr-4 mt-4 h-fit">
      <View className="relative">
        <View className="p-[2px] rounded-full border border-[#D2B48C]">
          <Avatar
            source={{ uri: getAvatarUrl(item.avatarId!!) || undefined }}
            size={60}
          />
        </View>
        <View
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#F5F5F0] ${
            item.isOnline ? "bg-[#8B4513]" : "bg-[#D2B48C]"
          }`}
        />
      </View>
      <Text className="text-center mt-1.5 text-sm text-[#2F1810]" numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-[#D2B48C]"
      style={{
        backgroundColor: '#F5F5F0',
      }}
      onPress={() => handleChat(item.$id)}
    >
      <View className="relative">
        <View className="p-[1px] rounded-full border border-[#D2B48C]">
          <Avatar
            source={{ uri: getAvatarUrl(item.avatarId!!) || undefined }}
            size={56}
          />
        </View>
        <View
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#F5F5F0] ${
            item.isOnline ? "bg-[#8B4513]" : "bg-[#D2B48C]"
          }`}
        />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-medium text-base text-[#2F1810]">{item.username}</Text>
        <Text className="text-[#8B7355] text-sm" numberOfLines={1}>
          {item.lastMessage || "Bắt đầu cuộc trò chuyện"}
        </Text>
      </View>
      {item.lastMessageTime && (
        <Text className="text-xs text-[#8B7355]">
          {item.lastMessageTime}
        </Text>
      )}
    </TouchableOpacity>
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFriends();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      <View className="max-h-40 mb-2 border-b border-[#D2B48C]">
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
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#8B4513"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-[#8B7355] text-base">
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
