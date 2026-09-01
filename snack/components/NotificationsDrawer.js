import React, { useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationsDrawerStyles } from '../styles/notificationsDrawerStyles';
import { colors } from '../styles/colors';
import { notificationsItems } from '../data/notificationsItems';

export function NotificationsDrawer({ isOpen, onClose, notifications = [] }) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const items = notifications.length > 0 ? notifications : notificationsItems;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, opacityAnim]);

  const drawerWidth = Math.min(screenWidth * 0.75, 320);
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0],
  });

  const handleNotificationPress = (notificationId) => {
    const item = items.find((notification) => notification.id === notificationId);
    if (!item) return;

    if (item.type === 'like') {
      navigation.navigate('favorites');
      return;
    }

    if (item.type === 'comment') {
      navigation.navigate('chat');
      return;
    }

    navigation.navigate('profile');
  };

  if (!isOpen && opacityAnim.__getValue() === 0) {
    return null;
  }

  return (
    <>
      <Animated.View 
        style={[
          notificationsDrawerStyles.backdrop,
          { opacity: opacityAnim, pointerEvents: isOpen ? 'auto' : 'none' }
        ]}
      >
        <TouchableOpacity 
          style={notificationsDrawerStyles.backdropTouch}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View 
        style={[
          notificationsDrawerStyles.container,
          {
            width: drawerWidth,
            transform: [{ translateX }],
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
      >
        <View style={notificationsDrawerStyles.header}>
          <View style={{ width: 28 }} />
          <Text style={notificationsDrawerStyles.headerTitle}>Notificações</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={notificationsDrawerStyles.content}>
          {items.length > 0 ? (
            items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  notificationsDrawerStyles.notificationItem,
                  item.unread && notificationsDrawerStyles.notificationItemUnread,
                ]}
                onPress={() => handleNotificationPress(item.id)}
              >
                <View style={notificationsDrawerStyles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={item.icon || 'bell'} 
                    size={20} 
                    color={item.unread ? colors.primary : colors.textMuted} 
                  />
                </View>
                <View style={notificationsDrawerStyles.notificationContent}>
                  <Text style={notificationsDrawerStyles.notificationMessage}>
                    {item.message}
                  </Text>
                  <Text style={notificationsDrawerStyles.notificationTimestamp}>
                    {item.timestamp}
                  </Text>
                </View>
                {item.unread && (
                  <View style={notificationsDrawerStyles.unreadIndicator} />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={notificationsDrawerStyles.emptyContainer}>
              <MaterialCommunityIcons 
                name="bell-off-outline" 
                size={48} 
                color={colors.textSubtle} 
              />
              <Text style={notificationsDrawerStyles.emptyText}>
                Sem notificações
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={notificationsDrawerStyles.footer}>
          <TouchableOpacity
            style={notificationsDrawerStyles.markAllButton}
            onPress={() => navigation.navigate('settings')}
          >
            <Text style={notificationsDrawerStyles.markAllText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}
