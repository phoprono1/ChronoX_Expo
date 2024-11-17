import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { avatars, client } from "@/constants/AppwriteClient";
import { useSelector } from "react-redux";
import { config } from "@/constants/Config";
import { getAvatarUrl } from "@/constants/AppwriteFile";
import { Ionicons } from "@expo/vector-icons";

const UsersProfile = () => {
  const userInfo = useSelector((state: any) => state.userInfo);
  const [followerCount, setFollowerCount] = useState(userInfo.follower);

  useEffect(() => {
    setFollowerCount(userInfo.follower);
  }, [userInfo.follower]);

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload));
        if (userInfo.$id == payload.$id) {
          setFollowerCount(payload.follower);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      <View className="flex-1">
        {/* Profile Info Section */}
        <View className="px-4 pt-4">
          {/* Name and Avatar Row */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-2xl font-bold text-[#2F1810]">{userInfo.name}</Text>
              <Text className="text-base text-[#8B7355]">{userInfo.email}</Text>
            </View>
            <TouchableOpacity>
              <Image
                source={{
                  uri: userInfo.avatar
                    ? getAvatarUrl(userInfo.avatar)
                    : String(avatars.getInitials(userInfo.name, 30, 30)),
                }}
                className="w-20 h-20 rounded-full border-2 border-[#8B4513]"
              />
            </TouchableOpacity>
          </View>
  
          {/* Bio */}
          {userInfo.bio && (
            <Text className="text-base text-[#2F1810] mb-4">
              {userInfo.bio || "Chưa cập nhật tiểu sử"}
            </Text>
          )}
  
          {/* Stats Row */}
          <View className="flex-row items-center space-x-4 mb-4 bg-[#FFFFFF] p-4 rounded-lg border border-[#D2B48C]">
            <View className="flex-1 items-center">
              <Text className="font-semibold text-[#2F1810]">{followerCount}</Text>
              <Text className="text-[#8B7355]">Người theo dõi</Text>
            </View>
            <View className="w-[1px] h-8 bg-[#D2B48C]" />
            <View className="flex-1 items-center">
              <Text className="font-semibold text-[#2F1810]">{userInfo.followed}</Text>
              <Text className="text-[#8B7355]">Đang theo dõi</Text>
            </View>
            <View className="w-[1px] h-8 bg-[#D2B48C]" />
            <View className="flex-1 items-center">
              <Text className="font-semibold text-[#2F1810]">{userInfo.postsCount}</Text>
              <Text className="text-[#8B7355]">Bài viết</Text>
            </View>
          </View>
  
          {/* Location and Website */}
          {(userInfo.location || userInfo.website) && (
            <View className="space-y-2 mb-4 bg-[#FFFFFF] p-4 rounded-lg border border-[#D2B48C]">
              {userInfo.location && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={16} color="#8B4513" />
                  <Text className="text-[#5f5c5b] ml-2">{userInfo.location}</Text>
                </View>
              )}
              {userInfo.website && (
                <View className="flex-row items-center">
                  <Ionicons name="link-outline" size={16} color="#8B4513" />
                  <Text className="text-[#2F1810] ml-2">{userInfo.website}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UsersProfile;