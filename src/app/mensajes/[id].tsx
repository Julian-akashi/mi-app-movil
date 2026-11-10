import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { getConversation, getConversationMessages, sendMessage, type ChatMessage, type ConversationSummary } from '../../database';
import { useAppTheme } from '../../contexts/theme-context';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { session } = useAuth();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const loadConversation = useCallback(async () => {
    if (!id || !session) return;
    try {
      const current = await getConversation(id, session.id);
      if (!current) {
        Alert.alert('Conversación no disponible', 'No tienes acceso a esta conversación.');
        router.back();
        return;
      }
      setConversation(current);
      setMessages(await getConversationMessages(id, session.id));
    } catch (error) {
      console.error('Error al cargar conversación:', error);
      Alert.alert('No se pudo cargar la conversación', 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [id, router, session]);

  useFocusEffect(useCallback(() => {
    loadConversation();
  }, [loadConversation]));

  const enviar = async () => {
    if (!id || !session || !body.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(id, session.id, body);
      setBody('');
      setMessages(await getConversationMessages(id, session.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.';
      Alert.alert('No se pudo enviar', message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !conversation) {
    return <View style={[styles.center, isDark && styles.darkScreen]}><ActivityIndicator size="large" color="#6eb6df" /></View>;
  }

  const otherName = conversation.owner_id === session?.id
    ? conversation.requester_name
    : conversation.owner_name;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, isDark && styles.darkScreen]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Regresar"><Text style={styles.back}>‹</Text></Pressable>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Conversación</Text>
        <View style={styles.headerSpace} />
      </View>
      <View style={[styles.objectCard, isDark && styles.darkCard]}>
        {conversation.imagen_url ? <Image source={{ uri: conversation.imagen_url }} style={styles.objectImage} /> : <View style={styles.objectPlaceholder}><Text style={styles.placeholderText}>✦</Text></View>}
        <View style={styles.objectText}>
          <Text style={styles.objectLabel}>Sobre el reporte</Text>
          <Text style={[styles.objectTitle, isDark && styles.darkText]} numberOfLines={1}>{conversation.titulo}</Text>
          <Text style={[styles.person, isDark && styles.darkMutedText]}>Conversando con {otherName}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.messageList}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {messages.length === 0 && <Text style={styles.empty}>Escribe para iniciar la conversación.</Text>}
        {messages.map((message) => {
          const mine = message.sender_id === session?.id;
          return (
            <View key={message.id} style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble, !mine && isDark && styles.darkTheirBubble]}>
              <Text style={[styles.messageText, !mine && isDark && styles.darkText, mine && styles.myMessageText]}>{message.body}</Text>
              <Text style={[styles.messageTime, mine && styles.myMessageTime]}>{formatTime(message.created_at)}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.composer, isDark && styles.darkComposer]}>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={body}
          onChangeText={setBody}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#8b9aaa"
          multiline
          textAlignVertical="top"
        />
        <Pressable style={[styles.send, (!body.trim() || sending) && styles.sendDisabled]} onPress={enviar} disabled={!body.trim() || sending}>
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  darkScreen: { backgroundColor: '#101820' },
  darkHeader: { borderBottomColor: '#293845' },
  darkCard: { backgroundColor: '#1b2933', borderColor: '#30414d' },
  darkComposer: { backgroundColor: '#1b2933', borderTopColor: '#30414d' },
  darkInput: { backgroundColor: '#26343e', color: '#edf4f7' },
  darkText: { color: '#edf4f7' },
  darkMutedText: { color: '#aebbc4' },
  center: { alignItems: 'center', backgroundColor: '#f6f8fa', flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', borderBottomColor: '#e5eaee', borderBottomWidth: 1, flexDirection: 'row', height: 58, paddingHorizontal: 15 },
  back: { color: '#071a2f', fontSize: 38, lineHeight: 38, paddingRight: 16 },
  headerTitle: { color: '#071a2f', flex: 1, fontSize: 18, fontWeight: '700' },
  headerSpace: { width: 25 },
  objectCard: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 16, borderWidth: 1, flexDirection: 'row', margin: 15, padding: 12 },
  objectImage: { borderRadius: 12, height: 64, width: 64 },
  objectPlaceholder: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 12, height: 64, justifyContent: 'center', width: 64 },
  placeholderText: { color: '#0b466d', fontSize: 24 },
  objectText: { flex: 1, marginLeft: 12 },
  objectLabel: { color: '#68727e', fontSize: 12 },
  objectTitle: { color: '#071a2f', fontSize: 17, fontWeight: '700', marginTop: 3 },
  person: { color: '#0b466d', fontSize: 13, marginTop: 4 },
  messages: { flexGrow: 1, padding: 15 },
  messageList: { flex: 1 },
  empty: { color: '#68727e', paddingTop: 35, textAlign: 'center' },
  bubble: { borderRadius: 16, marginBottom: 10, maxWidth: '82%', padding: 11 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#0b466d' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderColor: '#e1e6ea', borderWidth: 1 },
  darkTheirBubble: { backgroundColor: '#1b2933', borderColor: '#405361' },
  messageText: { color: '#263440', fontSize: 15, lineHeight: 21 },
  myMessageText: { color: '#fff' },
  messageTime: { color: '#8b9aaa', fontSize: 10, marginTop: 4, textAlign: 'right' },
  myMessageTime: { color: '#c4dbe8' },
  composer: { alignItems: 'flex-end', backgroundColor: '#fff', borderTopColor: '#e1e6ea', borderTopWidth: 1, flexDirection: 'row', gap: 8, padding: 10 },
  input: { backgroundColor: '#f4f6f8', borderRadius: 14, color: '#263440', flex: 1, maxHeight: 100, paddingHorizontal: 13, paddingVertical: 10 },
  send: { backgroundColor: '#0b466d', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  sendDisabled: { backgroundColor: '#b8c5ce' },
  sendText: { color: '#fff', fontWeight: '700' },
});
