import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
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
import { getFileUrl, uploadPostFiles } from "@/constants/AppwriteFile";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import VideoCall from "@/components/call/VideoCall";
import { initiateCall } from "@/constants/AppwriteCall";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  senderId: string | string[]; // ID của người gửi
  receiverId: string | string[]; // ID của người nhận
  text: string; // Nội dung tin nhắn
  timestamp: Date; // Thời gian gửi tin nhắn
  type: MessageType; // Thêm type để phân biệt loại tin nhắn
  mediaUrl?: string; // URL của media nếu có
  mediaType?: "image" | "video"; // Loại media
}

interface Call {
  $id: string;
  callerId: string | string[];
  receiverId: string | string[];
  channelName: string;
  status: "pending" | "accepted" | "rejected" | "ended";
}

const Chat = () => {
  const { userInfoId, currentUserId } = useLocalSearchParams();
  const [followingStatus, setFollowingStatus] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const userInfo = useSelector((state: any) => state.userInfo);
  const dispatch = useDispatch();
  const [isSending, setIsSending] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string>("");

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

  const loadChats = useCallback(async () => {
    if (!isUserDataLoaded || !userInfo.$id) {
      return;
    }

    try {
      const chats = await fetchChats(
        currentUserId,
        userInfo.$id,
        20, // Giữ số này vì interface yêu cầu
        undefined
      );

      if (chats.length > 0) {
        const mappedChats = chats.map(
          (chat): Message => ({
            senderId: chat.sender.$id,
            receiverId: chat.receiver.$id,
            text: chat.message || "",
            timestamp: new Date(chat.$createdAt),
            type: chat.messageType || MessageType.TEXT,
            mediaUrl: chat.mediaId ? getFileUrl(chat.mediaId) : undefined,
            mediaType:
              chat.messageType === "image"
                ? "image"
                : chat.messageType === "video"
                ? "video"
                : undefined,
          })
        );

        setMessages(mappedChats);
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    }
  }, [currentUserId, userInfo.$id, isUserDataLoaded]);

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  
  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    if (isSameDay(date, today)) {
      return "Hôm nay";
    } else if (isSameDay(date, yesterday)) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };
  
  const shouldShowDate = (currentMessage: Message, previousMessage: Message | undefined) => {
    if (!previousMessage) return true;
    return !isSameDay(currentMessage.timestamp, previousMessage.timestamp);
  };

  // Bỏ bớt useEffect không cần thiết, chỉ giữ lại các effect quan trọng
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (isUserDataLoaded && userInfo.$id) {
      loadChats();
    }
  }, [isUserDataLoaded, userInfo.$id, loadChats]);

  useEffect(() => {
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
          const messageDoc = await getMessageById(newMessageId);

          if (messageDoc) {
            // Chuyển đổi messageDoc thành đúng kiểu Message
            const newMessage: Message = {
              senderId: messageDoc.senderId,
              receiverId: messageDoc.receiverId,
              text: messageDoc.text,
              timestamp: messageDoc.timestamp,
              type: messageDoc.type || MessageType.TEXT,
              mediaUrl: messageDoc.mediaUrl,
              mediaType:
                messageDoc.type === MessageType.IMAGE
                  ? "image"
                  : messageDoc.type === MessageType.VIDEO
                  ? "video"
                  : undefined,
            };

            if (
              (newMessage.senderId === currentUserId &&
                newMessage.receiverId === userInfoId) ||
              (newMessage.senderId === userInfoId &&
                newMessage.receiverId === currentUserId)
            ) {
              setMessages((prevMessages) => {
                const messageExists = prevMessages.some(
                  (msg) =>
                    msg.timestamp.getTime() ===
                      newMessage.timestamp.getTime() &&
                    msg.senderId === newMessage.senderId
                );

                if (messageExists) {
                  return prevMessages;
                }

                return [newMessage, ...prevMessages];
              });
            }
          }
        }
      }
    );

    return () => {
      unsubscribe();
      setMessages([]);
    };
  }, [currentUserId, userInfoId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isSending) {
      setIsSending(true);
      try {
        await sendMessage(
          currentUserId,
          userInfoId,
          newMessage,
          MessageType.TEXT
        );
        setNewMessage("");
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        alert("Không thể gửi tin nhắn. Vui lòng thử lại!");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert("Cần cấp quyền truy cập thư viện ảnh!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const fileType = asset.type === "video" ? "video" : "image";

        // Upload file lên server với đúng định dạng
        const file = {
          uri: asset.uri,
          fileName: `${Date.now()}.${fileType === "video" ? "mp4" : "jpg"}`, // Đổi name thành fileName
          mimeType: fileType === "video" ? "video/mp4" : "image/jpeg", // Đổi type thành mimeType
          fileSize: asset.fileSize || 0, // Thêm fileSize nếu có
        };

        const fileId = await uploadPostFiles([file]);

        // Gửi tin nhắn với media
        await sendMessage(
          currentUserId,
          userInfoId,
          "",
          fileType === "video" ? MessageType.VIDEO : MessageType.IMAGE,
          fileId[0].id
        );
      }
    } catch (error) {
      console.error("Lỗi khi chọn media:", error);
      alert("Không thể tải lên media. Vui lòng thử lại!");
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const previousMessage = messages[index + 1];
    const showDate = shouldShowDate(item, previousMessage);
    const isCurrentUser = item.senderId === currentUserId;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    return (
      <View>
        {showDate && (
          <View className="flex items-center my-4">
            <View className="px-3 py-1 rounded-full bg-[#D2B48C]/20">
              <Text className="text-sm text-[#8B4513]">
                {formatMessageDate(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
        
        <View
          className={`flex-row ${
            isCurrentUser ? "justify-end" : "justify-start"
          } mb-2 px-4`}
        >
          <View
            className={`max-w-[80%] ${
              isCurrentUser
                ? "bg-[#8B4513] border-[#8B4513]"
                : "bg-white border-[#D2B48C]"
            } rounded-2xl px-4 py-2 border`}
            style={{
              shadowColor: "#2F1810",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            {item.type === MessageType.TEXT ? (
              <Text
                className={`${
                  isCurrentUser ? "text-[#F5F5F0]" : "text-[#2F1810]"
                } text-base`}
              >
                {item.text}
              </Text>
            ) : item.type === "image" ? (
              <View className="rounded-lg overflow-hidden border border-[#D2B48C]">
                <Image
                  source={{ uri: item.mediaUrl }}
                  className="w-[200] h-[200]"
                  contentFit="cover"
                />
              </View>
            ) : item.type === "video" ? (
              <View className="rounded-lg overflow-hidden border border-[#D2B48C]">
                <Video
                  source={{ uri: item.mediaUrl!! }}
                  className="w-[200] h-[200]"
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                />
              </View>
            ) : null}
            <Text
              className={`text-xs ${
                isCurrentUser ? "text-[#F5F5F0]/70" : "text-[#8B7355]"
              } mt-1`}
            >
              {messageTime}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Sửa lại startVideoCall để set channel ngay
  const startVideoCall = async () => {
    try {
      const channelName = `${currentUserId}-${userInfoId}`;
      setCurrentChannel(channelName); // Set channel trước
      await initiateCall(currentUserId, userInfoId);
      setIsInCall(true); // Người gọi vào call ngay
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc gọi:", error);
      Alert.alert("Không thể bắt đầu cuộc gọi");
      setCurrentChannel("");
      setIsInCall(false);
    }
  };

  // Thêm hàm updateCallStatus
  const updateCallStatus = async (
    callId: string,
    status: "pending" | "accepted" | "rejected" | "ended"
  ) => {
    try {
      await databases.updateDocument(
        config.databaseId,
        config.callsCollectionId,
        callId,
        {
          status: status,
        }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái cuộc gọi:", error);
    }
  };

  // Sửa lại useEffect để kiểm tra events
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.callsCollectionId}.documents`,
      async (response) => {
        // Chỉ xử lý khi có create hoặc update
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          const call = JSON.parse(JSON.stringify(response.payload));
          console.log("Call event:", response.events);
          console.log("Call payload:", call);

          const [callerId, receiverId] = call.channelName.split("-");

          if (receiverId === currentUserId && call.status === "pending") {
            Alert.alert(
              "Cuộc gọi đến",
              "Bạn có muốn trả lời cuộc gọi video không?",
              [
                {
                  text: "Từ chối",
                  onPress: () => updateCallStatus(call.$id, "rejected"),
                  style: "cancel",
                },
                {
                  text: "Chấp nhận",
                  onPress: async () => {
                    await updateCallStatus(call.$id, "accepted");
                    setCurrentChannel(call.channelName);
                    setIsInCall(true);
                  },
                },
              ]
            );
          }

          if (callerId === currentUserId && call.status === "accepted") {
            console.log("Caller joining channel:", call.channelName);
            setCurrentChannel(call.channelName);
            setIsInCall(true);
          }
        }
      }
    );

    return () => {
      unsubscribe();
      setIsInCall(false);
      setCurrentChannel("");
    };
  }, [currentUserId]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      {isInCall ? (
        <VideoCall
          channelName={currentChannel}
          onEndCall={() => {
            setIsInCall(false);
            setCurrentChannel("");
          }}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View className="flex-1">
            <View className="border-b border-[#D2B48C] p-4 bg-[#F5F5F0]">
              <UserAvatar
                userId={userInfo.$id}
                userName={userInfo.name}
                avatarUrl={userInfo.avatar}
                startVideoCall={startVideoCall}
              />
            </View>
  
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.timestamp.toString()}
              inverted
              className="flex-1"
            />
  
            <View className="p-2 border-t border-[#D2B48C] bg-white">
              <View className="flex-row items-center bg-[#F5F5F0] rounded-full border border-[#D2B48C] px-4">
                <TouchableOpacity
                  onPress={handleImagePicker}
                  className="py-2 pr-2"
                >
                  <FontAwesome5 name="image" size={24} color="#8B4513" />
                </TouchableOpacity>
  
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#8B7355"
                  className="flex-1 py-2 px-2 text-[#2F1810]"
                  multiline
                />
  
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="py-2 pl-2"
                >
                  <Ionicons
                    name="send"
                    size={24}
                    color={newMessage.trim() ? "#8B4513" : "#D2B48C"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default Chat;
