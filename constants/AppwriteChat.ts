import { ID, Query } from "react-native-appwrite";
import { databases } from "./AppwriteClient"; // Import client Appwrite
import { config } from "./Config"; // Import cấu hình
import { getFileUrl } from "./AppwriteFile";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  VOICE = "voice",
  FILE = "file",
  LOCATION = "location",
  CONTACT = "contact",
  STICKER = "sticker",
  REACTION = "reaction",
  POLL = "poll",
  EVENT = "event",
}

export const sendMessage = async (
  senderId: string | string[],
  receiverId: string | string[],
  message: string,
  messageType: MessageType,
  mediaId?: string
) => {
  try {
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      message: message,
      messageType: messageType, // Đổi từ type thành messageType
      mediaId: mediaId || null,
      responseTo: null
    };

    const response = await databases.createDocument(
      config.databaseId,
      config.chatCollectionId,
      ID.unique(),
      messageData
    );

    return response;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    throw error;
  }
};

// Hàm tải chat với phân trang
export const fetchChats = async (
  userId: string | string[],
  otherUserId: string | string[],
  limit: number,  // Giữ tham số này để tránh phải sửa interface
  lastID?: string | undefined  // Giữ tham số này để tránh phải sửa interface
) => {
  try {
    const query1 = [
      Query.and([
        Query.equal("sender", userId),
        Query.equal("receiver", otherUserId),
      ]),
      Query.orderDesc("$createdAt"),
    ];

    const query2 = [
      Query.and([
        Query.equal("sender", otherUserId),
        Query.equal("receiver", userId),
      ]),
      Query.orderDesc("$createdAt"),
    ];

    const [response1, response2] = await Promise.all([
      databases.listDocuments(
        config.databaseId,
        config.chatCollectionId,
        query1
      ),
      databases.listDocuments(
        config.databaseId,
        config.chatCollectionId,
        query2
      ),
    ]);

    const combinedChats = [...response1.documents, ...response2.documents];
    const sortedChats = combinedChats.sort(
      (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );
    
    console.log("Fetched messages:", {
      total: sortedChats.length,
      fromUser1: response1.documents.length,
      fromUser2: response2.documents.length
    });

    return sortedChats;
  } catch (error) {
    console.error("Lỗi khi tải tin nhắn:", error);
    throw error;
  }
};

export const getMessageById = async (messageId: string) => {
  try {
    const messageDocument = await databases.getDocument(
      config.databaseId,
      config.chatCollectionId,
      messageId
    );

    return {
      senderId: messageDocument.sender.$id,
      receiverId: messageDocument.receiver.$id,
      text: messageDocument.message || "",
      timestamp: new Date(messageDocument.$createdAt),
      type: messageDocument.messageType || MessageType.TEXT, // Đổi từ type thành messageType
      mediaUrl: messageDocument.mediaId ? getFileUrl(messageDocument.mediaId) : undefined,
      mediaType: messageDocument.messageType === "image" ? "image" : 
                messageDocument.messageType === "video" ? "video" : 
                undefined
    };
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return null;
  }
};
