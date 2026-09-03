import React from 'react';
import { Image, Text, View } from 'react-native';

export function isImageUri(value) {
  return typeof value === 'string' && /^(https?:|data:image|file:|content:)/i.test(value);
}

export function AvatarImage({ value, size = 44, style }) {
  if (isImageUri(value)) {
    return <Image source={{ uri: value }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode="cover" />;
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.58 }}>{value || '👤'}</Text>
    </View>
  );
}
