import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router"; // Sử dụng useRouter thay vì useNavigation
import { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInUser } from "@/constants/AppwriteUser";
import Icon from 'react-native-vector-icons/FontAwesome'; // Import biểu tượng

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Khởi tạo router

  const handleSignIn = async () => {
    try {
      const jwt = await signInUser(email, password); // Gọi phương thức signInUser
      await AsyncStorage.setItem('token', jwt); // Lưu token vào AsyncStorage
      router.replace('/(tabs)/home'); // Chuyển hướng về trang index sau khi đăng nhập thành công
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-6 text-gray-800">Đăng Nhập</Text>
      
      <View className="flex-row items-center border border-gray-300 rounded-md mb-4 w-full bg-white">
        <Icon name="envelope" size={20} color="#007BFF" style={{ margin: 10 }} />
        <TextInput
          placeholder="Email"
          className="flex-1 p-3"
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>

      <View className="flex-row items-center border border-gray-300 rounded-md mb-4 w-full bg-white">
        <Icon name="lock" size={20} color="#007BFF" style={{ margin: 10 }} />
        <TextInput
          placeholder="Mật khẩu"
          secureTextEntry
          className="flex-1 p-3"
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        className="bg-blue-500 p-3 rounded-md w-full mb-4"
        onPress={handleSignIn}
      >
        <Text className="text-white text-center font-semibold">Đăng Nhập</Text>
      </TouchableOpacity>

      <Link  href="/SignUp">
        <Text className="text-blue-500">Chưa có tài khoản? Đăng ký</Text>
      </Link>
    </View>
  );
}