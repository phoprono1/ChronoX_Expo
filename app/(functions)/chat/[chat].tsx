import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { client, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { Query } from "react-native-appwrite";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { setUserInfo } from "@/store/usersInfo";
import { isFollowing } from "@/constants/AppwriteFollow"; // Import hàm sendMessage
import {
  fetchChats,
  getMessageById,
  MessageType,
  sendMessage,
} from "@/constants/AppwriteChat";
import UserAvatar from "@/components/cards/UserAvatar";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { debounce, DebouncedFunc } from "lodash";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  senderId: string | string[]; // ID của người gửi
  receiverId: string | string[]; // ID của người nhận
  text: string; // Nội dung tin nhắn
  timestamp: Date; // Thời gian gửi tin nhắn
}

const Chat = () => {
  const { userInfoId, currentUserId } = useLocalSearchParams();
  const [followingStatus, setFollowingStatus] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [lastID, setLastID] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const userInfo = useSelector((state: any) => state.userInfo);
  const dispatch = useDispatch();

  const [canLoadMore, setCanLoadMore] = useState(true);
  const loadChatsRef = useRef<DebouncedFunc<() => void> | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const userDocuments = await databases.listDocuments(
        config.databaseId,
        config.userCollectionId,
        [Query.equal("$id", userInfoId)]
      );

      if (userDocuments.documents.length > 0) {
        const userDocument = userDocuments.documents[0];
        const userInfo = {
          $id: userDocument.$id,
          userId: userDocument.accountID,
          email: userDocument.email,
          avatar: userDocument.avatarId,
          name: userDocument.username,
          bio: userDocument.bio || "",
          followed: userDocument.followed || 0,
          follower: userDocument.follower || 0,
          location: userDocument.location || null,
          website: userDocument.website || null,
          postsCount: await getUserPostsCount(userDocument.$id),
        };

        dispatch(setUserInfo(userInfo));

        const following = await isFollowing(
          typeof currentUserId === "string" ? currentUserId : currentUserId[0],
          userInfo.$id
        );
        setFollowingStatus(following);
        setIsUserDataLoaded(true);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  }, [userInfoId, currentUserId, dispatch]);

  const loadChats = useCallback(() => {
    if (!canLoadMore || loadingMore || !isUserDataLoaded || !userInfo.$id)
      return;
    setLoadingMore(true);
    setCanLoadMore(false);

    const fetchData = async () => {
      try {
        const limit = 20;
        const chats = await fetchChats(
          currentUserId,
          userInfo.$id,
          limit,
          lastID || undefined
        );

        if (chats.length > 0) {
          const mappedChats = chats.map((chat) => ({
            senderId: chat.sender.$id,
            receiverId: userInfo.$id,
            text: chat.message,
            timestamp: new Date(chat.$createdAt),
          }));
          setMessages((prevMessages) => [...prevMessages, ...mappedChats]);
          setLastID(chats[chats.length - 1].$id);
          setCanLoadMore(true);
        } else {
          setCanLoadMore(false);
        }
        console.log(`Fetched chats at ${new Date().toISOString()}`);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
        setCanLoadMore(true);
      } finally {
        setLoadingMore(false);
      }
    };

    fetchData();
  }, [currentUserId, userInfo.$id, lastID, isUserDataLoaded]);

  useEffect(() => {
    loadChatsRef.current = debounce(loadChats, 500);
  }, [loadChats]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (isUserDataLoaded && userInfo.$id) {
      loadChats();
    }
  }, [isUserDataLoaded, userInfo.$id, loadChats]);

  useEffect(() => {
    if (
      isUserDataLoaded &&
      userInfo.$id &&
      canLoadMore &&
      loadChatsRef.current
    ) {
      loadChatsRef.current();
    }
  }, [isUserDataLoaded, userInfo.$id, canLoadMore]);

  useEffect(() => {
    // Lắng nghe sự kiện realtime
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.chatCollectionId}.documents`,
      async (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          const payload = JSON.parse(JSON.stringify(response.payload));
          const newMessageId = payload.$id;
          const newMessage = await getMessageById(newMessageId);
          // Kiểm tra xem tin nhắn có phải là của người gửi hoặc người nhận không
          if (
            newMessage &&
            ((newMessage.senderId === currentUserId &&
              newMessage.receiverId === userInfoId) ||
              (newMessage.senderId === userInfoId &&
                newMessage.receiverId === currentUserId))
          ) {
            setMessages((prevMessages) => [newMessage, ...prevMessages]); // Cập nhật danh sách tin nhắn
          }
        }
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
      setMessages([]); // Reset danh sách tin nhắn
      setLastID(null); // Reset lastID
    };
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        // Gửi tin nhắn
        await sendMessage(
          currentUserId,
          userInfoId,
          newMessage,
          MessageType.TEXT
        ); // Gửi tin nhắn với messageType là 'text'
        setNewMessage(""); // Xóa tin nhắn sau khi gửi
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        className={`flex-row ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-2`}
      >
        <View
          className={`max-w-[80%] ${
            isCurrentUser ? "bg-blue-500" : "bg-gray-100"
          } rounded-2xl px-4 py-2`}
        >
          <Text
            className={`${
              isCurrentUser ? "text-white" : "text-gray-800"
            } text-base`}
          >
            {item.text}
          </Text>
          <Text
            className={`text-xs ${
              isCurrentUser ? "text-blue-100" : "text-gray-500"
            } mt-1`}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -20 : 0}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="border-b border-gray-200 p-4">
          <UserAvatar
            userId={userInfo.$id}
            userName={userInfo.name}
            avatarUrl={userInfo.avatar}
          />
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          className="flex-1 px-4"
          inverted
          onEndReached={() => {
            if (canLoadMore && loadChatsRef.current) {
              loadChatsRef.current();
            }
          }}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />

        <View className="border-t border-gray-200 p-4">
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity className="p-2">
              <FontAwesome5 name="image" size={24} color="black" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <TextInput
                className="flex-1 text-base"
                placeholder="Nhắn tin..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
              />
              {newMessage.length > 0 && (
                <TouchableOpacity onPress={handleSendMessage} className="ml-2">
                  <Ionicons name="send" size={24} color="black" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Chat;
