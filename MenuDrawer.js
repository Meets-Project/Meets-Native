import React, { useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { menuDrawerStyles } from '../styles/menuDrawerStyles';
import { colors } from '../styles/colors';
import { menuItems } from '../data/menuItens'
import { useNavigation } from '@react-navigation/native';

export function MenuDrawer({ isOpen, onClose, onSelectItem }) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, opacityAnim]);

  const drawerWidth = Math.min(screenWidth * 0.75, 320);
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  if (!isOpen && opacityAnim.__getValue() === 0) {
    return null;
  }

  const user = {
    name: 'Você',
    avatar: '🙂',
  };

  return (
    <>
      <Animated.View 
        style={[
          menuDrawerStyles.backdrop,
          { opacity: opacityAnim, pointerEvents: isOpen ? 'auto' : 'none' }
        ]}
      >
        <TouchableOpacity 
          style={menuDrawerStyles.backdropTouch}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View 
        style={[
          menuDrawerStyles.container,
          {
            width: drawerWidth,
            transform: [{ translateX }],
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
      >
        <View style={menuDrawerStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={menuDrawerStyles.headerTitle}>Menu</Text>
          <View style={{ width: 28 }} />
        </View>
        <TouchableOpacity
          style={menuDrawerStyles.profileContainer}
          onPress={() => {
            if (onSelectItem) onSelectItem('profile');
            onClose();
          }}
        >
          <View style={menuDrawerStyles.avatar}>
            <Text style={menuDrawerStyles.avatarText}>{user.avatar}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={menuDrawerStyles.userName}>{user.name}</Text>
            <Text style={menuDrawerStyles.userSub}>Ver perfil</Text>
          </View>
        </TouchableOpacity>

        <ScrollView style={menuDrawerStyles.content}>
          {menuItems.map((item) => (
            <TouchableOpacity
                  key={item.id}
                  style={menuDrawerStyles.menuItem}
                  onPress={() => {
                    if (onSelectItem) {
                      onSelectItem(item.id);
                    } else {
                      // fallback: navigate directly if possible
                      try {
                        navigation.navigate(item.id);
                      } catch (e) {
                        // ignore if route doesn't exist
                      }
                    }
                    onClose();
                  }}
                >
              <MaterialCommunityIcons 
                name={item.icon || 'circle-outline'} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={menuDrawerStyles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={menuDrawerStyles.footer}>
          <TouchableOpacity
            style={menuDrawerStyles.logoutButton}
            onPress={() => navigation.navigate('Login')}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
            <Text style={menuDrawerStyles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}
