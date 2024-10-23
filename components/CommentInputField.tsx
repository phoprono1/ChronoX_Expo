import React from "react";
import { View, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CommentInputFieldProps extends TextInputProps {
  onSubmit: () => void;
}

const CommentInputField: React.FC<CommentInputFieldProps> = ({ onSubmit, ...props }) => {
  return (
    <View className="flex-row items-center p-3 bg-white border-t border-gray-200">
      <TextInput
        {...props}
        className="flex-1 bg-gray-100 p-3 rounded-full text-gray-700"
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity
        onPress={onSubmit}
        className="bg-blue-500 p-3 rounded-full ml-2"
        activeOpacity={0.7}
      >
        <Feather name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default CommentInputField;