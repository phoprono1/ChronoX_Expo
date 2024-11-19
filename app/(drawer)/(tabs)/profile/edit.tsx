import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { debounce } from "lodash";
import { getProvinces, searchLocation } from "@/services/LocationService";
import { updateUserInfo } from "@/constants/AppwriteUser";
import { updateUser } from "@/store/userSlice";

export default function EditProfile() {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // Khởi tạo form data từ user info
    setFormData({
      name: user.name || "",
      email: user.email || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
    });

    // Cleanup function
    return () => {
      isMounted.current = false;
      // Reset tất cả state về giá trị ban đầu
      setFormData({
        name: "",
        email: "",
        bio: "",
        location: "",
        website: "",
      });
      setShowLocationPicker(false);
      setLocationSearch("");
      setLocations([]);
      setIsLoading(false);

      // Cancel debounced search nếu đang pending
      debouncedSearch.cancel();
    };
  }, [user]);

  const handleSave = async () => {
    try {
      // So sánh với dữ liệu hiện tại để chỉ gửi các trường đã thay đổi
      const updates = {
        name: formData.name !== user.name ? formData.name : undefined,
        bio: formData.bio !== user.bio ? formData.bio : undefined,
        location:
          formData.location !== user.location ? formData.location : undefined,
        website:
          formData.website !== user.website ? formData.website : undefined,
      };

      await updateUserInfo(user.userId, updates);

      // Cập nhật Redux store
      dispatch(updateUser({
        ...user,
        name: formData.name || user.name,
        bio: formData.bio || user.bio,
        location: formData.location || user.location,
        website: formData.website || user.website
      }));

      // Hiển thị thông báo thành công
      Alert.alert("Thành công", "Đã cập nhật thông tin");
      router.back();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  // Hàm tìm kiếm với debounce
  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length > 0) {
        setIsLoading(true);
        const results = await searchLocation(text);
        setLocations(results);
        setIsLoading(false);
      } else {
        const provinces = await getProvinces();
        setLocations(provinces);
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Load danh sách tỉnh thành khi mở modal
  const handleOpenLocationPicker = async () => {
    setShowLocationPicker(true);
    setIsLoading(true);
    const provinces = await getProvinces();
    setLocations(provinces);
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#D2B48C]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-[#D2B48C]/20"
        >
          <ArrowLeft size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl text-[#2F1810] font-medium text-center mr-10">
          Chỉnh sửa hồ sơ
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Form Fields */}
        <View className="space-y-4">
          {/* Tên */}
          <View>
            <Text className="text-[#8B7355] mb-2">Tên hiển thị</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              className="bg-white p-3 rounded-lg border border-[#D2B48C] text-[#2F1810]"
              placeholder="Nhập tên hiển thị"
              placeholderTextColor="#8B7355"
            />
          </View>

          {/* Email */}
          <View>
            <Text className="text-[#8B7355] mb-2">Email</Text>
            <TextInput
              value={formData.email}
              editable={false} // Email không được sửa
              className="bg-[#F5F5F0] p-3 rounded-lg border border-[#D2B48C] text-[#8B7355]"
            />
          </View>

          {/* Bio */}
          <View>
            <Text className="text-[#8B7355] mb-2">Tiểu sử</Text>
            <TextInput
              value={formData.bio}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, bio: text }))
              }
              className="bg-white p-3 rounded-lg border border-[#D2B48C] text-[#2F1810]"
              placeholder="Thêm tiểu sử"
              placeholderTextColor="#8B7355"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Location Field */}
          <View>
            <Text className="text-[#8B7355] mb-2">Vị trí</Text>
            <TouchableOpacity
              onPress={handleOpenLocationPicker}
              className="bg-white p-3 rounded-lg border border-[#D2B48C]"
            >
              <Text
                className={`${
                  formData.location ? "text-[#2F1810]" : "text-[#8B7355]"
                }`}
              >
                {formData.location || "Chọn tỉnh thành"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location Picker Modal */}
          <Modal
            visible={showLocationPicker}
            animationType="slide"
            transparent={true}
          >
            <SafeAreaView className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#F5F5F0] rounded-t-3xl">
                <View className="p-4 border-b border-[#D2B48C]">
                  <TextInput
                    placeholder="Tìm kiếm tỉnh thành"
                    value={locationSearch}
                    onChangeText={(text) => {
                      setLocationSearch(text);
                      debouncedSearch(text);
                    }}
                    className="bg-white p-3 rounded-lg border border-[#D2B48C]"
                    placeholderTextColor="#8B7355"
                  />
                </View>

                {isLoading ? (
                  <View className="p-4">
                    <ActivityIndicator color="#8B4513" />
                  </View>
                ) : (
                  <FlatList
                    data={locations}
                    keyExtractor={(item) => item.code.toString()}
                    className="max-h-96"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className="p-4 border-b border-[#D2B48C] active:bg-[#D2B48C]/20"
                        onPress={() => {
                          setFormData((prev) => ({
                            ...prev,
                            location: item.name,
                          }));
                          setShowLocationPicker(false);
                          setLocationSearch("");
                        }}
                      >
                        <Text className="text-[#2F1810]">{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <View className="p-4">
                        <Text className="text-[#8B7355] text-center">
                          Không tìm thấy kết quả
                        </Text>
                      </View>
                    )}
                  />
                )}

                <TouchableOpacity
                  className="p-4 bg-[#8B4513] m-4 rounded-xl"
                  onPress={() => {
                    setShowLocationPicker(false);
                    setLocationSearch("");
                  }}
                >
                  <Text className="text-[#F5F5F0] text-center font-medium">
                    Đóng
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Website */}
          <View>
            <Text className="text-[#8B7355] mb-2">Website</Text>
            <TextInput
              value={formData.website}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, website: text }))
              }
              className="bg-white p-3 rounded-lg border border-[#D2B48C] text-[#2F1810]"
              placeholder="Thêm website"
              placeholderTextColor="#8B7355"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Thống kê không thể sửa */}
          <View className="bg-[#F5F5F0] p-4 rounded-lg border border-[#D2B48C]">
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#8B7355]">Bài viết</Text>
              <Text className="text-[#2F1810] font-medium">
                {user.postsCount}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#8B7355]">Người theo dõi</Text>
              <Text className="text-[#2F1810] font-medium">
                {user.follower}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#8B7355]">Đang theo dõi</Text>
              <Text className="text-[#2F1810] font-medium">
                {user.followed}
              </Text>
            </View>
          </View>
        </View>

        {/* Nút Lưu */}
        <TouchableOpacity
          onPress={handleSave}
          className="bg-[#8B4513] p-4 rounded-xl mt-6 mb-4"
          style={{
            shadowColor: "#2F1810",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-[#F5F5F0] text-center text-lg font-medium">
            Lưu thay đổi
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
