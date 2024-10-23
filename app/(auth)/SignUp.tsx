import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { createUser } from "@/constants/AppwriteUser";
import Icon from 'react-native-vector-icons/FontAwesome';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      console.error('Mật khẩu không khớp!');
      return;
    }
    try {
      await createUser(name, email, password); // Gọi phương thức createUser
      router.push('/SignIn');
    } catch (error) {
      console.error('Đăng ký thất bại:', error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-6 text-gray-800">Đăng Ký</Text>
      
      <View className="flex-row items-center border border-gray-300 rounded-md mb-4 w-full bg-white">
        <Icon name="user" size={20} color="#007BFF" style={{ margin: 10 }} />
        <TextInput
          placeholder="Tên"
          className="flex-1 p-3"
          onChangeText={setName}
        />
      </View>

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

      <View className="flex-row items-center border border-gray-300 rounded-md mb-4 w-full bg-white">
        <Icon name="lock" size={20} color="#007BFF" style={{ margin: 10 }} />
        <TextInput
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          className="flex-1 p-3"
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity 
        className="bg-blue-500 p-3 rounded-md w-full mb-4"
        onPress={handleSignUp}
      >
        <Text className="text-white text-center font-semibold">Đăng Ký</Text>
      </TouchableOpacity>

      <Link href="/SignIn">
        <Text className="text-blue-500">Đã có tài khoản? Đăng nhập</Text>
      </Link>
    </View>
  );
}
