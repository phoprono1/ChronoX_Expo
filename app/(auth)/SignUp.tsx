import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
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
      await createUser(name, email, password);
      router.push('/SignIn');
    } catch (error) {
      console.error('Đăng ký thất bại:', error);
    }
  };

  return (
    <View className="flex-1 justify-start items-center p-4 bg-[#CEC6B5]">
      <View className="flex-row items-center justify-center mt-20 mb-12 rounded-full">
        <Image 
          source={require('@/assets/images/CHRONOX.png')} 
          className="w-40 h-40"
          resizeMode="contain"
        />
      </View>

      <View className="w-full max-w-sm">
        <View className="bg-[#F5F5F0] p-6 rounded-lg shadow-md border border-[#D2B48C]">
          <Text className="text-2xl font-bold mb-6 text-[#2F1810] text-center">Đăng Ký</Text>
          
          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-4 bg-white">
            <Icon name="user" size={20} color="#8B4513" style={{ margin: 10 }} />
            <TextInput
              placeholder="Tên"
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setName}
              placeholderTextColor="#8B7355"
            />
          </View>

          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-4 bg-white">
            <Icon name="envelope" size={20} color="#8B4513" style={{ margin: 10 }} />
            <TextInput
              placeholder="Email"
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor="#8B7355"
            />
          </View>

          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-4 bg-white">
            <Icon name="lock" size={20} color="#8B4513" style={{ margin: 10 }} />
            <TextInput
              placeholder="Mật khẩu"
              secureTextEntry
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setPassword}
              placeholderTextColor="#8B7355"
            />
          </View>

          <View className="flex-row items-center border border-[#D2B48C] rounded-md mb-6 bg-white">
            <Icon name="lock" size={20} color="#8B4513" style={{ margin: 10 }} />
            <TextInput
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              className="flex-1 p-3 text-[#2F1810]"
              onChangeText={setConfirmPassword}
              placeholderTextColor="#8B7355"
            />
          </View>

          <TouchableOpacity 
            className="bg-[#8B4513] p-4 rounded-md w-full mb-4 border border-[#D2B48C]"
            onPress={handleSignUp}
          >
            <Text className="text-[#F5F5F0] text-center font-semibold">Đăng Ký</Text>
          </TouchableOpacity>

          <Link href="/SignIn">
            <Text className="text-[#8B4513] text-center underline">
              Đã có tài khoản? Đăng nhập
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}