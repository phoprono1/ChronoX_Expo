import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // Import ImageManipulator
import RichTextEditor from "../RichTextEditor";
import MediaPreview from "../MediaPreview"; // Import component MediaPreview
import { useRouter } from "expo-router";
import { createPost } from "@/constants/AppwritePost";

import { Image as ImageIcon, Video, Trash2, TriangleAlert } from "lucide-react-native";
import axios from "axios";
import { Dialog } from "react-native-ui-lib"; // Thêm import Dialog
import { ActivityIndicator } from "react-native";

interface CreatePostProps {
  onPost: (post: {
    description: string;
    mediaUri: string[];
    hashtags: string[];
  }) => void;
}

// Thêm interface cho API response
interface HateSpeechResponse {
  results: {
    "hate-speech-detection": string;
    "toxic-speech-detection": string;
    "hate-spans-detection": string;
  };
  processing_time: number;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPost }) => {
  const [mediaUris, setMediaUris] = useState<string[]>([]); // Đổi thành mảng
  const [hashtags, setHashtags] = useState<string>("");
  const bodyRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const router = useRouter();
  const [pressed, setPressed] = useState<boolean>(false); // Khởi tạo pressed
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [violatedContent, setViolatedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = Platform.select({
    ios: "http://localhost:8000/analyze-text",
    android: "http://10.0.2.2:8000/analyze-text",
  });

  const checkHateSpeech = async (text: string): Promise<HateSpeechResponse> => {
    try {
      const response = await axios.post(API_URL ?? "", {
        text: text,
      });
      return response.data;
    } catch (error) {
      console.error("Error checking hate speech:", error);
      throw error;
    }
  };

  const highlightHateContent = (text: string, hateSpans: string) => {
    // Tìm các đoạn văn bản nằm giữa [hate] và [hate]
    const matches = hateSpans.match(/\[hate\](.*?)\[hate\]/g);
    if (!matches) return text;

    // Highlight từng đoạn văn bản
    let highlightedText = text;
    matches.forEach((match) => {
      const content = match.replace(/\[hate\]/g, "");
      highlightedText = highlightedText.replace(
        content,
        `**${content}**` // Đánh dấu bằng markdown hoặc có thể dùng HTML tags
      );
    });
    return highlightedText;
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
    });

    if (!result.canceled) {
      const newUris = await Promise.all(
        result.assets.map(async (asset) => {
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1000 } }], // Giảm chiều rộng xuống 1000px
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // Nén ảnh
          );
          return manipResult.uri; // Trả về URI đã nén
        })
      );

      setMediaUris((prev) => [...prev, ...newUris]); // Cập nhật mảng mediaUris
    }
  };

  const handleVideoPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setMediaUris((prev) => [...prev, uri]); // Thêm URI video vào mảng
    }
  };

  const extractHashtags = (text: string) => {
    const regex = /#\w+/g; // Tìm tất cả các từ bắt đầu bằng #
    const foundHashtags = text.match(regex);
    return foundHashtags ? foundHashtags.map((tag) => tag.substring(1)) : []; // Trả về mảng các hashtags mà không có dấu #
  };

  const removeHashtagsFromDescription = (text: string) => {
    return text.replace(/#\w+\s*/g, ""); // Loại bỏ các từ bắt đầu bằng # và khoảng trắng theo sau
  };

  const handlePost = async () => {
    const description = bodyRef.current;

    if (!description.trim()) {
      Alert.alert("Thông báo", "Không được để mô tả trống!");
      return;
    }
    setIsLoading(true); // Bắt đầu loading

    try {
      // // Kiểm tra hate speech trước khi đăng
      const hateSpeechResult = await checkHateSpeech(description);

      if (
        hateSpeechResult.results["hate-speech-detection"] !== "clean" ||
        hateSpeechResult.results["toxic-speech-detection"] !== "none"
      ) {
        // Highlight nội dung vi phạm
        const highlightedText = highlightHateContent(
          description,
          hateSpeechResult.results["hate-spans-detection"]
        );

        setDialogContent("Phát hiện nội dung vi phạm quy tắc cộng đồng");
        setViolatedContent(highlightedText);
        setDialogVisible(true);
        return;
      }

      // Nếu không có vi phạm, tiếp tục đăng bài
      const extractedHashtags = extractHashtags(description);
      const cleanedDescription = removeHashtagsFromDescription(description);

      await createPost(mediaUris, cleanedDescription, extractedHashtags);

      // Reset fields và callback
      setMediaUris([]);
      setHashtags("");
      onPost({
        description: cleanedDescription,
        mediaUri: mediaUris,
        hashtags: extractedHashtags,
      });

      Alert.alert("Thành công", "Bài viết đã được đăng");
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
      Alert.alert("Lỗi", "Không thể đăng bài viết");
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  const removeMedia = (uri: string) => {
    setMediaUris((prev) => prev.filter((mediaUri) => mediaUri !== uri)); // Xóa URI khỏi mảng
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      className="flex-1"
    >
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-[#2F1810]/30">
          <View className="bg-[#F5F5F0] p-6 rounded-2xl items-center mx-4 border border-[#D2B48C]">
            <ActivityIndicator size="large" color="#8B4513" />
            <Text className="mt-3 text-[#2F1810]">
              Đang kiểm tra nội dung...
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 p-4 bg-[#F5F5F0]">
          <Text className="text-center text-2xl text-[#2F1810] mb-4">
            Tạo bài viết
          </Text>

          <View className="flex-1 bg-white rounded-lg border border-[#D2B48C] overflow-hidden">
            <RichTextEditor
              editorRef={editorRef}
              onChange={(body) => (bodyRef.current = body)}
            />
          </View>

          {mediaUris.length > 0 && (
            <ScrollView horizontal className="mt-4" showsHorizontalScrollIndicator={false}>
              {mediaUris.map((uri, index) => (
                <View key={index} className="w-40 h-full mr-4">
                  <View className="rounded-lg overflow-hidden border border-[#D2B48C]">
                    <MediaPreview mediaUri={uri} />
                  </View>
                  <Pressable
                    onPress={() => removeMedia(uri)}
                    className="absolute top-2 right-2 bg-[#8B4513] rounded-full p-1.5"
                  >
                    <Trash2 size={20} color="#F5F5F0" strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View className="flex-row items-center mt-4 border-2 border-[#D2B48C] rounded-2xl p-4 bg-white">
            <Text className="text-lg text-[#2F1810] flex-1">
              Thêm ảnh hoặc video
            </Text>
            <TouchableOpacity
              onPress={handleImagePicker}
              className="flex-none ml-auto mr-4"
            >
              <ImageIcon size={28} color="#8B4513" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleVideoPicker}
              className="flex-none"
            >
              <Video size={28} color="#8B4513" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Pressable
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={handlePost}
            disabled={isLoading}
            className={`bg-[#8B4513] p-3 rounded-2xl mt-6 w-1/2 mx-auto
              ${pressed ? "opacity-80" : "opacity-100"}
              ${isLoading ? "opacity-50" : ""}`}
            style={{
              shadowColor: '#2F1810',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center space-x-2">
                <ActivityIndicator color="#F5F5F0" size="small" />
                <Text className="text-[#F5F5F0]">Đang xử lý...</Text>
              </View>
            ) : (
              <Text className="text-[#F5F5F0] text-center text-lg">Đăng bài</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Dialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        containerStyle={{
          backgroundColor: '#F5F5F0',
          padding: 24,
          borderRadius: 16,
          width: '90%',
          borderWidth: 2,
          borderColor: '#D2B48C',
          alignSelf: 'center',
          alignItems: 'center',
          shadowColor: '#2F1810',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View className="items-center w-full">
          <View className="w-16 h-16 mb-6 items-center justify-center">
            <View className="absolute inset-0 bg-[#8B4513] rounded-full opacity-10" />
            <TriangleAlert size={40} color="#8B4513" strokeWidth={1.5} />
          </View>

          <Text className="text-xl text-[#2F1810] mb-5 text-center font-medium">
            {dialogContent}
          </Text>

          <View className="w-full bg-white/80 p-5 rounded-xl mb-5 border border-[#D2B48C]">
            <Text className="text-[#2F1810] mb-3 text-base">
              Vui lòng chỉnh sửa những nội dung được đánh dấu:
            </Text>
            <View className="bg-[#FFF5E6] p-3 rounded-lg border border-[#D2B48C]/50">
              <Text className="text-[#8B4513] text-base">
                {violatedContent}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setDialogVisible(false)}
            className="bg-[#8B4513] w-full p-4 rounded-xl active:bg-[#6B3410]"
            style={{
              shadowColor: '#2F1810',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-[#F5F5F0] text-center text-lg font-medium">
              Đã hiểu, tôi sẽ chỉnh sửa
            </Text>
          </TouchableOpacity>
        </View>
      </Dialog>
    </KeyboardAvoidingView>
  );
};

export default CreatePost;
