import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { useAppTheme } from '../../contexts/theme-context';
import { deleteObject, getDatabase } from '../../database';

type UserObject = {
  id: string;
  titulo: string;
  categoria: string;
  tipo_aviso: string;
  estado: string;
  facultad: string;
  lugar: string;
  imagen_url: string;
  created_at: string;
};

type NoticeFilter = 'todos' | 'activos' | 'cerrados';

export default function MisAvisosScreen() {
  const [objects, setObjects] = useState<UserObject[]>([]);
  const [filter, setFilter] = useState<NoticeFilter>('todos');
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const loadObjects = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const database = await getDatabase();
      const data = await database.getAllAsync<UserObject>(
        'SELECT id, titulo, categoria, tipo_aviso, estado, facultad, lugar, imagen_url, created_at FROM objetos WHERE usuario_id = ? ORDER BY datetime(created_at) DESC',
        session.id
      );
      setObjects(data);
    } catch (error) {
      console.error('Error al cargar mis avisos:', error);
      Alert.alert('No se pudieron cargar tus avisos', 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => {
    loadObjects();
  }, [loadObjects]));

  const filteredObjects = useMemo(
    () => objects.filter((item) => filter === 'todos' || (filter === 'activos' ? item.estado === 'pendiente' : item.estado === 'cerrado')),
    [filter, objects]
  );

  const remove = (item: UserObject) => {
    if (!session) return;
    Alert.alert('Eliminar aviso', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteObject(item.id, session.id);
            await loadObjects();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo eliminar el aviso.';
            Alert.alert('No se pudo eliminar', message);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, isDark && styles.darkScreen]}>
      <FlatList
        data={filteredObjects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={[styles.header, isDark && styles.darkHeader]}>
              <Text style={[styles.brandText, isDark && styles.darkText]}>Encuentra<Text style={styles.brandAccent}>FCC</Text></Text>
            </View>

            <View style={styles.heading}>
              <View style={styles.headingRow}>
                <Text style={[styles.title, isDark && styles.darkText]}>Mis avisos</Text>
                <Text style={[styles.publishedCount, isDark && styles.darkPublishedCount]}>{objects.length} publicados</Text>
              </View>
              <Text style={[styles.subtitle, isDark && styles.darkMutedText]}>
                Administra tus publicaciones y actualiza su estado cuando los resuelvas.
              </Text>
            </View>

            <View style={styles.filters}>
              <FilterButton
                label="Todos"
                count={objects.length}
                selected={filter === 'todos'}
                onPress={() => setFilter('todos')}
              />
              <FilterButton
                label="Activos / Pendientes"
                count={objects.filter((item) => item.estado === 'pendiente').length}
                selected={filter === 'activos'}
                onPress={() => setFilter('activos')}
              />
              <FilterButton
                label="Cerrados"
                count={objects.filter((item) => item.estado === 'cerrado').length}
                selected={filter === 'cerrados'}
                onPress={() => setFilter('cerrados')}
              />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <NoticeCard
            item={item}
            onDetail={() => router.push({ pathname: '/objeto/[id]', params: { id: item.id } })}
            onEdit={() => router.push({ pathname: '/crear', params: { id: item.id } })}
            onDelete={() => remove(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.message}>Cargando tus avisos...</Text>
          ) : (
            <Text style={styles.message}>No hay avisos en esta categoría.</Text>
          )
        }
        ListFooterComponent={
          <View style={styles.protocol}>
            <Text style={styles.protocolTitle}>Protocolo de entrega segura</Text>
            <Text style={styles.protocolText}>
              Al acordar la devolución con un estudiante, te recomendamos encontrarte en recepción de FCC o caseta de vigilancia institucional.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function FilterButton({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable style={[styles.filterButton, isDark && styles.darkFilterButton, selected && styles.filterButtonSelected]} onPress={onPress}>
      <Text style={[styles.filterLabel, isDark && styles.darkText, selected && styles.filterLabelSelected]}>{label}</Text>
      <Text style={[styles.filterCount, isDark && styles.darkMutedText, selected && styles.filterLabelSelected]}>({count})</Text>
    </Pressable>
  );
}

function NoticeCard({
  item,
  onDetail,
  onEdit,
  onDelete,
}: {
  item: UserObject;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isFound = item.tipo_aviso === 'encontre';
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, isDark && styles.darkCard]}>
      <View style={styles.cardMain}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>Sin foto</Text></View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.badges}>
            <Text style={[styles.typeBadge, isFound ? styles.foundBadge : styles.lostBadge]}>
              {isFound ? 'Encontrado' : 'Perdido'}
            </Text>
            <Text style={styles.stateBadge}>{formatState(item.estado)}</Text>
          </View>
          <Text style={[styles.cardTitle, isDark && styles.darkText]} numberOfLines={1}>{item.titulo}</Text>
          <Text style={[styles.cardDetail, isDark && styles.darkMutedText]} numberOfLines={1}>⌖ {item.facultad || 'Facultad no especificada'}</Text>
          <Text style={[styles.cardDetail, isDark && styles.darkMutedText]} numberOfLines={1}>
            Publicado el {formatDate(item.created_at)} · {item.lugar || 'Lugar no especificado'}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.detailButton} onPress={onDetail}>
          <Text style={styles.detailButtonText}>Ver detalle</Text>
        </Pressable>
        <Pressable style={styles.editButton} onPress={onEdit} accessibilityRole="button">
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete} accessibilityRole="button">
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatState(value: string) {
  if (value === 'cerrado') return 'Cerrado';
  return 'Pendiente';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recientemente';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  darkScreen: { backgroundColor: '#101820' },
  darkHeader: { borderBottomColor: '#293845' },
  darkCard: { backgroundColor: '#1b2933', borderColor: '#30414d' },
  darkFilterButton: { borderColor: '#405361' },
  darkText: { color: '#edf4f7' },
  darkMutedText: { color: '#aebbc4' },
  darkPublishedCount: { backgroundColor: '#263b4a', color: '#d8eaf3' },
  listContent: { paddingBottom: 28, paddingHorizontal: 20 },
  header: { borderBottomColor: '#e5eaee', borderBottomWidth: 1, height: 72, justifyContent: 'center', marginHorizontal: -20, paddingHorizontal: 20 },
  brandText: { color: '#071a2f', fontSize: 22, fontWeight: '700' },
  brandAccent: { color: '#16a1d5' },
  heading: { paddingTop: 22 },
  headingRow: { alignItems: 'center', flexDirection: 'row' },
  title: { color: '#071a2f', fontSize: 30, fontWeight: '700' },
  publishedCount: { backgroundColor: '#dce8f1', borderRadius: 13, color: '#082a4e', fontSize: 12, fontWeight: '700', marginLeft: 10, paddingHorizontal: 10, paddingVertical: 5 },
  subtitle: { color: '#69757f', fontSize: 15, lineHeight: 20, marginTop: 5 },
  filters: { flexDirection: 'row', gap: 9, marginBottom: 18, marginTop: 22 },
  filterButton: { alignItems: 'center', borderColor: '#d3dce3', borderRadius: 19, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 },
  filterButtonSelected: { backgroundColor: '#dce8f1', borderColor: '#a8bfd1' },
  filterLabel: { color: '#69757f', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  filterLabelSelected: { color: '#082a4e', fontWeight: '700' },
  filterCount: { color: '#69757f', fontSize: 12 },
  card: { backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 17, borderWidth: 1, marginBottom: 14, padding: 14, shadowColor: '#19344a', shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  cardMain: { flexDirection: 'row' },
  image: { borderRadius: 11, height: 100, width: 100 },
  imagePlaceholder: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 11, height: 100, justifyContent: 'center', width: 100 },
  placeholderText: { color: '#526575', fontSize: 12 },
  cardInfo: { flex: 1, marginLeft: 14, minWidth: 0 },
  badges: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  typeBadge: { borderRadius: 12, fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4 },
  lostBadge: { backgroundColor: '#ffe0df', color: '#ce2d2b' },
  foundBadge: { backgroundColor: '#d9f4e7', color: '#008b5b' },
  stateBadge: { backgroundColor: '#fff3d8', borderRadius: 12, color: '#dc8500', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4 },
  cardTitle: { color: '#172635', fontSize: 17, fontWeight: '700', marginTop: 8 },
  cardDetail: { color: '#69757f', fontSize: 13, marginTop: 5 },
  cardActions: { alignItems: 'center', borderTopColor: '#edf0f2', borderTopWidth: 1, flexDirection: 'row', gap: 9, marginTop: 14, paddingTop: 11 },
  detailButton: { backgroundColor: '#edf0f2', borderRadius: 17, paddingHorizontal: 14, paddingVertical: 8 },
  detailButtonText: { color: '#172635', fontSize: 13, fontWeight: '700' },
  editButton: { backgroundColor: '#e0edf5', borderColor: '#c4d6e2', borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  editButtonText: { color: '#0b466d', fontSize: 13, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fde7e7', borderColor: '#f1bcbc', borderRadius: 17, borderWidth: 1, marginLeft: 'auto', paddingHorizontal: 13, paddingVertical: 8 },
  deleteButtonText: { color: '#bd2525', fontSize: 13, fontWeight: '700' },
  protocol: { backgroundColor: '#f0f3f5', borderColor: '#dfe5e9', borderRadius: 15, borderWidth: 1, marginTop: 16, padding: 16 },
  protocolTitle: { color: '#082a4e', fontSize: 15, fontWeight: '700' },
  protocolText: { color: '#69757f', fontSize: 14, lineHeight: 20, marginTop: 5 },
  message: { color: '#69757f', fontSize: 16, paddingVertical: 30, textAlign: 'center' },
});
