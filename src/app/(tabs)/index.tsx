import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { deleteObject, getDatabase } from '../../database';

type ObjectRecord = {
  id: string;
  titulo: string;
  categoria: string;
  tipo_aviso: 'perdi' | 'encontre';
  facultad: string;
  lugar: string;
  estado: string;
  imagen_url: string;
  created_at: string;
  usuario_id: string;
};

type StatusFilter = 'todos' | 'perdidos' | 'encontrados';

const CATEGORIES = ['Todas', 'Credenciales', 'Electrónicos', 'Llaves', 'Accesorios'];

export default function HomeScreen() {
  const [objetos, setObjetos] = useState<ObjectRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const router = useRouter();

  const obtenerObjetos = useCallback(async () => {
    setLoading(true);
    try {
      const database = await getDatabase();
      const data = await database.getAllAsync<ObjectRecord>(
        'SELECT id, titulo, categoria, tipo_aviso, facultad, lugar, estado, imagen_url, created_at FROM objetos ORDER BY datetime(created_at) DESC'
      );
      setObjetos(data);
    } catch (error) {
      console.error('Error al cargar objetos locales:', error);
      Alert.alert('No se pudieron cargar los avisos', 'Intenta nuevamente en unos momentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      obtenerObjetos();
    }, [obtenerObjetos])
  );

  const objetosFiltrados = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return objetos.filter((item) => {
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'perdidos' && item.tipo_aviso === 'perdi') ||
        (statusFilter === 'encontrados' && item.tipo_aviso === 'encontre');
      const matchesCategory = categoryFilter === 'Todas' || item.categoria === categoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        `${item.titulo} ${item.categoria} ${item.facultad} ${item.lugar}`.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, objetos, search, statusFilter]);

  const eliminarAviso = (item: ObjectRecord) => {
    if (!session || item.usuario_id !== session.id) {
      return;
    }

    Alert.alert('Eliminar aviso', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteObject(item.id, session.id);
            await obtenerObjetos();
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
        <Text style={styles.loadingText}>Cargando avisos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={objetosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.brand}>
                <Text style={styles.brandText}>
                  Encuentra<Text style={styles.brandAccent}>FCC</Text>
                </Text>
              </View>
            </View>

            <View style={styles.welcomeCard}>
              <View style={styles.welcomeText}>
                <Text style={styles.greeting}>¡Hola, {session?.nombre || 'usuario'}!</Text>
                <Text style={styles.greetingDescription}>
                  ¿Has perdido o encontrado alguna{'\n'}pertenencia hoy?
                </Text>
              </View>
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeBadgeMark}>✦</Text>
                <Text style={styles.welcomeBadgeText}>EncuentraFCC</Text>
              </View>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o palabra clave"
                  placeholderTextColor="#7d8490"
                  returnKeyType="search"
                />
              </View>
            </View>

            <View style={styles.statusTabs}>
              <StatusTab
                label="Todos"
                count={objetos.length}
                selected={statusFilter === 'todos'}
                onPress={() => setStatusFilter('todos')}
              />
              <StatusTab
                label="Perdidos"
                count={objetos.filter((item) => item.tipo_aviso === 'perdi').length}
                selected={statusFilter === 'perdidos'}
                onPress={() => setStatusFilter('perdidos')}
              />
              <StatusTab
                label="Encontrados"
                count={objetos.filter((item) => item.tipo_aviso === 'encontre').length}
                selected={statusFilter === 'encontrados'}
                onPress={() => setStatusFilter('encontrados')}
              />
            </View>

            <View style={styles.facultyFilter}>
              <Text style={styles.locationIcon}>⌖</Text>
              <Text style={styles.facultyText}>Todas las facultades</Text>
              <Text style={styles.chevron}>⌄</Text>
            </View>

            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.categoryChip, categoryFilter === item && styles.categoryChipSelected]}
                  onPress={() => setCategoryFilter(item)}>
                  <Text style={[styles.categoryText, categoryFilter === item && styles.categoryTextSelected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Avisos recientes en</Text>
                <Text style={styles.sectionTitle}>Campus</Text>
              </View>
              <Text style={styles.resultCount}>{objetosFiltrados.length} activos</Text>
              <Text style={styles.sortText}>↕ Más{'\n'}recientes</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ObjectCard
            item={item}
            isOwner={item.usuario_id === session?.id}
            onPress={() => router.push({ pathname: '/objeto/[id]', params: { id: item.id } })}
            onEdit={() => router.push({ pathname: '/crear', params: { id: item.id } })}
            onDelete={() => eliminarAviso(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay avisos que coincidan con tu búsqueda.</Text>}
      />
    </View>
  );
}

function StatusTab({
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
  return (
    <Pressable style={[styles.statusTab, selected && styles.statusTabSelected]} onPress={onPress}>
      <Text style={[styles.statusLabel, selected && styles.statusLabelSelected]}>{label}</Text>
      <Text style={[styles.statusCount, selected && styles.statusLabelSelected]}>({count})</Text>
    </Pressable>
  );
}

function ObjectCard({
  item,
  isOwner,
  onPress,
  onEdit,
  onDelete,
}: {
  item: ObjectRecord;
  isOwner: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isFound = item.tipo_aviso === 'encontre';
  const statusText = formatState(item.estado);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImageContainer}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.cardImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>✦</Text>
          </View>
        )}
        <Text style={[styles.typeBadge, isFound ? styles.foundBadge : styles.lostBadge]}>
          {isFound ? 'Encontrado' : 'Perdido'}
        </Text>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.cardTopRow}>
          <Text style={styles.stateBadge}>{statusText}</Text>
          <Text style={styles.timeText}>◷ {formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.detailText} numberOfLines={1}>▣  {item.categoria}</Text>
        <Text style={styles.detailText} numberOfLines={1}>⌂  {item.facultad || 'Facultad no especificada'}</Text>
        <Text style={styles.detailText} numberOfLines={1}>⌖  {item.lugar}</Text>
        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable
              style={styles.editButton}
              onPress={(event) => {
                event.stopPropagation();
                onEdit();
              }}>
              <Text style={styles.editButtonText}>Editar</Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation();
                onDelete();
              }}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function formatState(value: string) {
  if (value === 'recuperado') return 'Recuperado';
  if (value === 'cerrado') return 'Cerrado';
  return 'Pendiente';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Reciente';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  center: { alignItems: 'center', backgroundColor: '#f6f8fa', flex: 1, justifyContent: 'center' },
  loadingText: { color: '#526575', marginTop: 10 },
  listContent: { paddingBottom: 28, paddingHorizontal: 20 },
  header: { alignItems: 'center', borderBottomColor: '#e8edf1', borderBottomWidth: 1, flexDirection: 'row', height: 72, justifyContent: 'space-between', marginHorizontal: -20, paddingHorizontal: 22 },
  brand: { alignItems: 'center', flexDirection: 'row' },
  brandText: { color: '#071a2f', fontSize: 21, fontWeight: '700' },
  brandAccent: { color: '#16a1d5' },
  welcomeCard: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e6eaed', borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, minHeight: 150, paddingHorizontal: 20, shadowColor: '#19344a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  welcomeText: { flex: 1 },
  greeting: { color: '#071a2f', fontSize: 26, fontWeight: '700', marginBottom: 5 },
  greetingDescription: { color: '#52606d', fontSize: 16, lineHeight: 22 },
  welcomeBadge: { alignItems: 'center', backgroundColor: '#f0f3f5', borderColor: '#e1e6ea', borderRadius: 15, borderWidth: 1, height: 62, justifyContent: 'center', marginLeft: 10, width: 80 },
  welcomeBadgeMark: { backgroundColor: '#07517b', borderRadius: 5, color: '#f7be35', fontSize: 11, marginBottom: 3, paddingHorizontal: 4 },
  welcomeBadgeText: { color: '#07517b', fontSize: 7, fontWeight: '700' },
  searchRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 20 },
  searchBox: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 18, borderWidth: 1, flex: 1, flexDirection: 'row', height: 60, paddingHorizontal: 16 },
  searchIcon: { color: '#102538', fontSize: 30, marginRight: 10 },
  searchInput: { color: '#283747', flex: 1, fontSize: 16 },
  statusTabs: { backgroundColor: '#e9ecef', borderRadius: 18, flexDirection: 'row', marginTop: 20, padding: 5 },
  statusTab: { alignItems: 'center', borderRadius: 13, flex: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 4 },
  statusTabSelected: { backgroundColor: '#fff' },
  statusLabel: { color: '#273442', fontSize: 15, fontWeight: '600' },
  statusLabelSelected: { color: '#071a2f', fontWeight: '700' },
  statusCount: { color: '#737d88', fontSize: 13 },
  facultyFilter: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 25, flexDirection: 'row', marginTop: 22, minHeight: 44, paddingHorizontal: 16 },
  locationIcon: { color: '#082a4e', fontSize: 22, marginRight: 9 },
  facultyText: { color: '#082a4e', flex: 1, fontSize: 15, fontWeight: '600' },
  chevron: { color: '#082a4e', fontSize: 22 },
  categoryList: { gap: 10, paddingVertical: 13 },
  categoryChip: { backgroundColor: '#fff', borderColor: '#dde3e8', borderRadius: 22, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  categoryChipSelected: { backgroundColor: '#0b466d', borderColor: '#0b466d' },
  categoryText: { color: '#273442', fontSize: 14 },
  categoryTextSelected: { color: '#fff', fontWeight: '700' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 14, marginTop: 8 },
  sectionTitle: { color: '#071a2f', fontSize: 20, fontWeight: '700' },
  resultCount: { backgroundColor: '#dce8f1', borderRadius: 19, color: '#082a4e', fontSize: 14, fontWeight: '700', marginLeft: 'auto', paddingHorizontal: 13, paddingVertical: 8 },
  sortText: { color: '#68727e', fontSize: 14, marginLeft: 10 },
  card: { backgroundColor: '#fff', borderColor: '#e5e9ec', borderRadius: 19, borderWidth: 1, flexDirection: 'row', marginBottom: 14, minHeight: 166, padding: 14, shadowColor: '#19344a', shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  cardImageContainer: { height: 122, marginRight: 14, position: 'relative', width: 122 },
  cardImage: { borderRadius: 14, height: '100%', width: '100%' },
  imagePlaceholder: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 14, height: '100%', justifyContent: 'center', width: '100%' },
  imagePlaceholderText: { color: '#0b466d', fontSize: 33 },
  typeBadge: { borderRadius: 13, fontSize: 12, fontWeight: '700', left: 7, paddingHorizontal: 9, paddingVertical: 4, position: 'absolute', top: 7 },
  lostBadge: { backgroundColor: '#ffe0df', color: '#ce2d2b' },
  foundBadge: { backgroundColor: '#d9f4e7', color: '#008b5b' },
  cardDetails: { flex: 1, minWidth: 0 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  stateBadge: { backgroundColor: '#fff3d8', borderRadius: 12, color: '#dc8500', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4 },
  timeText: { color: '#737d88', fontSize: 12 },
  cardTitle: { color: '#101b26', fontSize: 17, fontWeight: '700', marginVertical: 7 },
  detailText: { borderBottomColor: '#edf0f2', borderBottomWidth: 1, color: '#68727e', fontSize: 14, paddingBottom: 5, paddingTop: 3 },
  emptyText: { color: '#68727e', fontSize: 16, paddingVertical: 32, textAlign: 'center' },
  ownerActions: { flexDirection: 'row', gap: 8, marginTop: 7 },
  editButton: { backgroundColor: '#e0edf5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  editButtonText: { color: '#0b466d', fontSize: 12, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fde7e7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  deleteButtonText: { color: '#bd2525', fontSize: 12, fontWeight: '700' },
});
