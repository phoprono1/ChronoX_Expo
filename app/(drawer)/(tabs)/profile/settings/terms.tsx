import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";

const Terms = () => {
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
          Điều khoản sử dụng
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-6 border border-[#D2B48C]">
          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            1. Giới thiệu
          </Text>
          <Text className="text-[#2F1810] mb-6 leading-6">
            Chào mừng bạn đến với ChronoX - ứng dụng mạng xã hội. 
            Bằng việc sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản sau đây.
          </Text>

          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            2. Tài khoản người dùng
          </Text>
          <Text className="text-[#2F1810] mb-6 leading-6">
            • Bạn phải cung cấp thông tin chính xác khi đăng ký tài khoản{"\n"}
            • Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình{"\n"}
            • Chúng tôi có quyền khóa tài khoản nếu phát hiện vi phạm
          </Text>

          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            3. Quyền riêng tư
          </Text>
          <Text className="text-[#2F1810] mb-6 leading-6">
            • Chúng tôi tôn trọng và bảo vệ thông tin cá nhân của bạn{"\n"}
            • Dữ liệu của bạn được mã hóa và lưu trữ an toàn{"\n"}
            • Chúng tôi không chia sẻ thông tin với bên thứ ba
          </Text>

          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            4. Sử dụng ứng dụng
          </Text>
          <Text className="text-[#2F1810] mb-6 leading-6">
            • Bạn đồng ý sử dụng ứng dụng cho mục đích hợp pháp{"\n"}
            • Không được sao chép hoặc phân phối lại nội dung{"\n"}
            • Tôn trọng quyền sở hữu trí tuệ của chúng tôi
          </Text>

          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            5. Thay đổi điều khoản
          </Text>
          <Text className="text-[#2F1810] mb-6 leading-6">
            Chúng tôi có quyền thay đổi điều khoản sử dụng mà không cần thông báo trước. 
            Việc tiếp tục sử dụng ứng dụng sau khi thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.
          </Text>

          <Text className="text-lg font-medium text-[#8B4513] mb-4">
            6. Liên hệ
          </Text>
          <Text className="text-[#2F1810] leading-6">
            Nếu bạn có bất kỳ thắc mắc nào về điều khoản sử dụng, vui lòng liên hệ với chúng tôi qua email: support@chronox.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Terms;