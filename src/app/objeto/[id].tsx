import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { deleteObject, getObjectById, type LocalObject } from '../../database';

export default function ObjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [object, setObject] = useState<LocalObject | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();

  const loadObject = useCallback(() => {
    if (!id) return;

    setLoading(true);
    getObjectById(id)
      .then(setObject)
      .catch((error) => {
        console.error('Error al cargar el detalle del aviso:', error);
        Alert.alert('No se pudo cargar el aviso', 'Intenta nuevamente.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(loadObject);

  const eliminar = () => {
    if (!object || !session || object.usuario_id !== session.id) return;

    Alert.alert('Eliminar aviso', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteObject(object.id, session.id);
            router.back();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo eliminar el aviso.';
            Alert.alert('No se pudo eliminar', message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b466d" />
      </View>
    );
  }

  if (!object) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Aviso no encontrado.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = session?.id === object.usuario_id;
  const isFound = object.tipo_aviso === 'encontre';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Regresar">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Detalle del aviso</Text>
          <Text style={styles.headerId}>#{object.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.imageContainer}>
          {object.imagen_url ? (
            <Image source={{ uri: object.imagen_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Sin fotografía</Text>
            </View>
          )}
          <View style={styles.badges}>
            <Text style={[styles.typeBadge, isFound ? styles.foundBadge : styles.lostBadge]}>
              {isFound ? '✓ Encontrado' : '⌕ Perdido'}
            </Text>
            <Text style={styles.stateBadge}>
              {formatState(object.estado)}
            </Text>
          </View>
        </View>

        <Text style={styles.categoryBadge}>▣  {object.categoria}</Text>
        <Text style={styles.title}>{object.titulo}</Text>
        <Text style={styles.published}>Publicado {formatDate(object.created_at)}</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ⓘ  Información del aviso</Text>
          <InfoRow label="FACULTAD O DEPENDENCIA" value={object.facultad} icon="⌂" />
          <InfoRow label="LUGAR ESPECÍFICO" value={object.lugar} icon="⌖" />
          <InfoRow label="FECHA DEL SUCESO" value={object.fecha_suceso} icon="▣" />
          <InfoRow label="MEDIO DE CONTACTO" value={object.contacto} icon="✉" />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>▤  Descripción del objeto</Text>
          <Text style={styles.description}>{object.descripcion}</Text>
        </View>

        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable
              style={styles.editButton}
              onPress={() => router.push({ pathname: '/crear', params: { id: object.id } })}>
              <Text style={styles.editButtonText}>Editar aviso</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={eliminar}>
              <Text style={styles.deleteButtonText}>Eliminar aviso</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Text style={styles.infoIconText}>{icon}</Text></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
      </View>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recientemente';
  return `el ${date.toLocaleDateString('es-MX')}`;
}

function formatState(value: string) {
  if (value === 'recuperado') return 'Recuperado';
  if (value === 'cerrado') return 'Cerrado';
  return 'Pendiente';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  center: { alignItems: 'center', backgroundColor: '#f6f8fa', flex: 1, justifyContent: 'center', padding: 24 },
  content: { paddingBottom: 36, paddingHorizontal: 15 },
  header: { alignItems: 'center', flexDirection: 'row', height: 58 },
  backArrow: { color: '#071a2f', fontSize: 38, lineHeight: 38, paddingRight: 16 },
  headerTitle: { color: '#071a2f', flex: 1, fontSize: 17, fontWeight: '700' },
  headerId: { color: '#69757f', fontSize: 12 },
  imageContainer: { backgroundColor: '#dce8f1', borderRadius: 16, height: 245, overflow: 'hidden', position: 'relative' },
  image: { height: '100%', width: '100%' },
  imagePlaceholder: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  imagePlaceholderText: { color: '#526575', fontSize: 16 },
  badges: { flexDirection: 'row', gap: 8, left: 12, position: 'absolute', top: 12 },
  typeBadge: { borderRadius: 15, fontSize: 12, fontWeight: '700', paddingHorizontal: 11, paddingVertical: 6 },
  lostBadge: { backgroundColor: '#ffe0df', color: '#ce2d2b' },
  foundBadge: { backgroundColor: '#d9f4e7', color: '#008b5b' },
  stateBadge: { backgroundColor: '#fff3d8', borderRadius: 15, color: '#dc8500', fontSize: 12, fontWeight: '700', paddingHorizontal: 11, paddingVertical: 6 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#dce8f1', borderRadius: 15, color: '#082a4e', fontSize: 13, marginTop: 16, paddingHorizontal: 11, paddingVertical: 6 },
  title: { color: '#071a2f', fontSize: 25, fontWeight: '700', lineHeight: 31, marginTop: 12 },
  published: { color: '#69757f', fontSize: 13, marginTop: 7 },
  sectionCard: { backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 17, borderWidth: 1, marginTop: 18, padding: 14 },
  sectionTitle: { color: '#071a2f', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoRow: { alignItems: 'center', backgroundColor: '#f4f6f8', borderRadius: 12, flexDirection: 'row', marginTop: 9, padding: 10 },
  infoIcon: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 8, height: 35, justifyContent: 'center', marginRight: 10, width: 35 },
  infoIconText: { color: '#082a4e', fontSize: 18 },
  infoText: { flex: 1 },
  infoLabel: { color: '#52606d', fontSize: 10, letterSpacing: 0.4 },
  infoValue: { color: '#172635', fontSize: 14, marginTop: 3 },
  description: { color: '#394854', fontSize: 15, lineHeight: 23 },
  ownerActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  editButton: { backgroundColor: '#0b466d', borderRadius: 23, flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fde7e7', borderColor: '#f1bcbc', borderRadius: 23, borderWidth: 1, flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#bd2525', fontSize: 14, fontWeight: '700' },
  notFound: { color: '#52606d', fontSize: 17, marginBottom: 14 },
  backButton: { backgroundColor: '#0b466d', borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11 },
  backButtonText: { color: '#fff', fontWeight: '700' },
});
