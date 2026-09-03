import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScreenHeader } from '../components/ScreenHeader';
import { BottomNav } from '../components/BottomNav';
import { MenuDrawer } from '../components/MenuDrawer';
import { NotificationsDrawer } from '../components/NotificationsDrawer';
import { LoadingScreen } from '../screens/LoadingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { CreateFlowScreen } from '../screens/CreateFlowScreen';
import { ImageEditorScreen } from '../screens/ImageEditorScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ShareProfileScreen } from '../screens/ShareProfileScreen';
import { PresentationRatingScreen } from '../screens/PresentationRatingScreen';
import { SpeakerProfileScreen } from '../screens/SpeakerProfileScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { EventRatingScreen } from '../screens/EventRatingScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SavesScreen } from '../screens/SavesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { menuItems } from '../data/menuItens';
import { icons } from '../data/icons';
import { colors } from '../styles/colors';
import { appStyles } from '../styles/appStyles';
import { getNotifications, onUnauthorized } from '../services/api';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          return <MaterialCommunityIcons name={icons[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tabs.Screen name="search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tabs.Screen name="create" component={CreateScreen} options={{ tabBarLabel: 'Criar' }} />
      <Tabs.Screen name="chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      <Tabs.Screen name="profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tabs.Navigator>
  );
}

export default function AppNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (!isNotificationsOpen) return;
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, [isNotificationsOpen]);
  const [currentRouteName, setCurrentRouteName] = useState('Loading');

  useEffect(() => {
    return onUnauthorized(() => {
      if (!navigationRef.isReady()) return;
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  }, []);

  const getTitleForRoute = (routeName) => {
    if (routeName === 'MainTabs') return 'Resenha';
    const tabTitles = {
      home: 'Resenha',
      search: 'Buscar',
      create: 'Criar',
      chat: 'Chat',
      profile: 'Perfil',
    };
    if (tabTitles[routeName]) return tabTitles[routeName];
    const detailTitles = {
      CreateFlow: 'Criar',
      ImageEditor: 'Editor de imagem',
      EditProfile: 'Editar perfil',
      ShareProfile: 'Compartilhar perfil',
      PresentationRating: 'Avaliar apresentação',
      SpeakerProfile: 'Perfil público',
      EventDetail: 'Detalhes do evento',
      EventRating: 'Avaliar evento',
      Ranking: 'Ranking de apresentadores',
      Dashboard: 'Dashboard',
    };
    if (detailTitles[routeName]) return detailTitles[routeName];
    const menu = menuItems.find((m) => m.id === routeName);
    if (menu) return menu.label;
    // fallback: format capitalized name
    return routeName ? routeName.charAt(0).toUpperCase() + routeName.slice(1) : 'Meets';
  };

  const getActiveRouteName = (state) => {
    if (!state || !state.routes || typeof state.index !== 'number') return 'Loading';

    const route = state.routes[state.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  const syncCurrentRoute = (state) => {
    try {
      const rootState = state || navigationRef.getRootState();
      const activeName = getActiveRouteName(rootState);
      if (activeName) setCurrentRouteName(activeName);
    } catch (e) {}
  };

  const authRoutes = new Set(['Loading', 'Login', 'Signup']);
  const tabRoutes = new Set(['home', 'search', 'create', 'chat', 'profile']);
  const showChrome = !authRoutes.has(currentRouteName);
  const isSecondaryScreen = showChrome && !tabRoutes.has(currentRouteName);
  const headerTitle = showChrome ? getTitleForRoute(currentRouteName) : '';

  const handleBack = () => {
    try {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
      } else {
        navigationRef.navigate('MainTabs', { screen: 'home' });
      }
    } catch (e) {
      navigationRef.navigate('MainTabs', { screen: 'home' });
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={syncCurrentRoute}
      onStateChange={syncCurrentRoute}
    >
      <View style={appStyles.safeArea}>
        {showChrome ? (
          <ScreenHeader
            title={headerTitle}
            canGoBack={isSecondaryScreen}
            onBackPress={handleBack}
            onMenuPress={() => setIsMenuOpen(true)}
            onLogoPress={() => {
              navigationRef.navigate('MainTabs', { screen: 'home' });
            }}
            onNotificationsPress={() => setIsNotificationsOpen(true)}
          />
        ) : null}

        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />

          <Stack.Screen name="CreateFlow" component={CreateFlowScreen} />
          <Stack.Screen name="ImageEditor" component={ImageEditorScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ShareProfile" component={ShareProfileScreen} />
          <Stack.Screen name="PresentationRating" component={PresentationRatingScreen} />
          <Stack.Screen name="SpeakerProfile" component={SpeakerProfileScreen} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
          <Stack.Screen name="EventRating" component={EventRatingScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />

          <Stack.Screen name="favorites" component={FavoritesScreen} />
          <Stack.Screen name="history" component={HistoryScreen} />
          <Stack.Screen name="saves" component={SavesScreen} />
          <Stack.Screen name="settings" component={SettingsScreen} />
          <Stack.Screen name="help" component={HelpScreen} />
          <Stack.Screen name="about" component={AboutScreen} />

        </Stack.Navigator>

        {showChrome ? (
          <>
            <MenuDrawer
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onSelectItem={(id) => {
                setIsMenuOpen(false);
                try {
                  if (!navigationRef.isReady()) return;

                  if (id === 'profile') {
                    navigationRef.navigate('MainTabs', { screen: 'profile' });
                    return;
                  }

                  navigationRef.navigate(id);
                } catch (e) {
                  // ignore navigation error
                }
              }}
            />

            <NotificationsDrawer
              isOpen={isNotificationsOpen}
              notifications={notifications}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </>
        ) : null}

        {isSecondaryScreen ? (
          <BottomNav
            activeTab={currentRouteName}
            onSelectTab={(id) => {
              try {
                if (!navigationRef.isReady()) return;
                navigationRef.navigate('MainTabs', { screen: id });
              } catch (e) {}
            }}
          />
        ) : null}
      </View>
    </NavigationContainer>
  );
}
