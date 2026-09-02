import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { FeedCard } from '../components/FeedCard';
import { getBackendBaseUrl } from '../data/apiConfig';
import { feedItems } from '../data/feedItems';
import { screenStyles } from '../styles/screenStyles';

export function HomeScreen() {
  const [backendStatus, setBackendStatus] = useState('Conectando backend...');

  useEffect(() => {
    async function checkBackend() {
      try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}/health`);

        if (!response.ok) {
          setBackendStatus('Backend respondeu com erro');
          return;
        }

        setBackendStatus(`Backend online em ${baseUrl}`);
      } catch (error) {
        setBackendStatus('Backend offline. Inicie o serviço ou confira o proxy interno.');
      }
    }

    checkBackend();
  }, []);

  return (
    <FlatList
      data={feedItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedCard item={item} />}
      contentContainerStyle={screenStyles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      ListHeaderComponent={
        <View style={screenStyles.backendStatusCard}>
          <Text style={screenStyles.backendStatusTitle}>Status do Backend</Text>
          <Text style={screenStyles.backendStatusText}>{backendStatus}</Text>
        </View>
      }
    />
  );
}
