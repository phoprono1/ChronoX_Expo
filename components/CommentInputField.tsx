import React from "react";
import { View, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Send } from 'lucide-react-native';

interface CommentInputFieldProps extends TextInputProps {
  onSubmit: () => void;
}

const CommentInputField: React.FC<CommentInputFieldProps> = ({ onSubmit, ...props }) => {
  return (
    <View className="flex-row items-center p-3 bg-[#F5F5F0] border-t border-[#D2B48C]">
      <TextInput
        {...props}
        className="flex-1 bg-[#FFFFFF] p-3 rounded-full text-[#2F1810] border border-[#D2B48C]"
        placeholderTextColor="#8B7355"
      />
      <TouchableOpacity
        onPress={onSubmit}
        className="bg-[#8B4513] p-3 rounded-full ml-2"
        activeOpacity={0.7}
      >
        <Send 
          size={20} 
          color="#F5F5F0" 
          strokeWidth={2}
        />
      </TouchableOpacity>
    </View>
  );
};

export default CommentInputField;