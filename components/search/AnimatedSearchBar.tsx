import React from "react";
import { TouchableOpacity, Text, ViewStyle, SafeAreaView } from "react-native";
import { Search as SearchIcon } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface AnimatedSearchBarProps {
  style?: ViewStyle;
  isExpanded: boolean;
  onPress?: () => void;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  style,
  isExpanded,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isExpanded ? 56 : 48, { duration: 300 }),
      borderRadius: withTiming(isExpanded ? 0 : 24, { duration: 300 }),
    };
  });

  return (
    <SafeAreaView>
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 bg-[#FFFFFF] rounded-full border border-[#D2B48C]"
          style={{ 
            height: "100%",
            shadowColor: "#8B4513",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={onPress}
        >
          <SearchIcon size={20} color="#8B4513" strokeWidth={2} />
          <Text className="text-[#8B7355] text-base font-medium">
            Tìm kiếm bài viết, người dùng, hashtag...
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default AnimatedSearchBar;