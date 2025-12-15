import React from 'react';
import { View } from 'react-native';
import { User } from '@/types';

interface UserMarkerProps {
  user: User;
  isCatSitter?: boolean;
  onPress?: () => void;
}

const UserMarker: React.FC<UserMarkerProps> = () => {
  return <View testID="web-user-marker-placeholder" />;
};

export default UserMarker;
