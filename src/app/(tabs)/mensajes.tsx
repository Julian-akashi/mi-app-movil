import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { getConversations, type ConversationSummary } from '../../database';

export default function MensajesScreen() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const router = useRouter();

  const loadConversations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      setConversations(await getConversations(session.id));
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      Alert.alert('No se pudieron cargar los mensajes', 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => {
    loadConversations();
  }, [loadConversations]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0b466d" /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>Encuentra<Text style={styles.brandAccent}>FCC</Text></Text>
        <Text style={styles.title}>Mensajes</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes conversaciones.</Text>}
        renderItem={({ item }) => {
          const otherName = item.owner_id === session?.id ? item.requester_name : item.owner_name;
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/mensajes/[id]', params: { id: item.id } })}>
              {item.imagen_url ? (
                <Image source={{ uri: item.imagen_url }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}><Text style={styles.placeholderText}>✦</Text></View>
              )}
              <View style={styles.rowText}>
                <Text style={styles.objectTitle} numberOfLines={1}>{item.titulo}</Text>
                <Text style={styles.person} numberOfLines={1}>{otherName}</Text>
                <Text style={styles.preview} numberOfLines={1}>{item.last_message || 'Nueva conversación'}</Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.unread}><Text style={styles.unreadText}>{item.unread_count}</Text></View>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  center: { alignItems: 'center', backgroundColor: '#f6f8fa', flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', borderBottomColor: '#e5eaee', borderBottomWidth: 1, flexDirection: 'row', height: 72, justifyContent: 'space-between', paddingHorizontal: 20 },
  brand: { color: '#071a2f', fontSize: 21, fontWeight: '700' },
  brandAccent: { color: '#16a1d5' },
  title: { color: '#263440', fontSize: 18 },
  content: { padding: 20 },
  row: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginBottom: 12, padding: 12 },
  image: { borderRadius: 12, height: 58, width: 58 },
  placeholder: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 12, height: 58, justifyContent: 'center', width: 58 },
  placeholderText: { color: '#0b466d', fontSize: 24 },
  rowText: { flex: 1, marginLeft: 12 },
  objectTitle: { color: '#071a2f', fontSize: 16, fontWeight: '700' },
  person: { color: '#0b466d', fontSize: 13, marginTop: 3 },
  preview: { color: '#68727e', fontSize: 13, marginTop: 4 },
  unread: { alignItems: 'center', backgroundColor: '#0b466d', borderRadius: 14, minWidth: 28, paddingHorizontal: 7, paddingVertical: 5 },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { color: '#68727e', fontSize: 16, paddingTop: 40, textAlign: 'center' },
});
