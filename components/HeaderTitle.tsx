import React from 'react';
import { Text, View } from 'react-native';

interface HeaderTitleProps {
    title: String;
  }
const HeaderTitle: React.FC<HeaderTitleProps> = ({ title }) => {
  return (
    <View className='flex-1 items-center'>
      <Text className='text-lg font-bold'>{title}</Text>
    </View>
  );
};

export default HeaderTitle;