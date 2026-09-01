import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export function AnimatedPressable({ children, style, onPress, disabled, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue) => {
    Animated.spring(scale, {
      toValue,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => animateScale(0.97)}
      onPressOut={() => animateScale(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
