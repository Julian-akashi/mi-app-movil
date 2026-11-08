import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { getDatabase } from '../../database';

type ProfileStats = {
  published: number;
  recovered: number;
  faculty: string;
};

export default function PerfilScreen() {
  const [stats, setStats] = useState<ProfileStats>({ published: 0, recovered: 0, faculty: 'Facultad no especificada' });
  const [loading, setLoading] = useState(true);
  const { session, setSession } = useAuth();
  const router = useRouter();

  const loadStats = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const database = await getDatabase();
      const summary = await database.getFirstAsync<{ published: number; recovered: number }>(
        `SELECT COUNT(*) AS published,
                SUM(CASE WHEN estado = 'recuperado' THEN 1 ELSE 0 END) AS recovered
         FROM objetos WHERE usuario_id = ?`,
        session.id
      );
      const faculty = await database.getFirstAsync<{ facultad: string }>(
        `SELECT facultad FROM objetos
         WHERE usuario_id = ? AND facultad != ''
         GROUP BY facultad ORDER BY COUNT(*) DESC LIMIT 1`,
        session.id
      );
      setStats({
        published: summary?.published ?? 0,
        recovered: summary?.recovered ?? 0,
        faculty: faculty?.facultad || 'Facultad no especificada',
      });
    } catch (error) {
      console.error('Error al cargar estadísticas del perfil:', error);
      Alert.alert('No se pudo cargar tu perfil', 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => {
    loadStats();
  }, [loadStats]));

  const logout = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await setSession(null);
          router.replace('/login');
        },
      },
    ]);
  };

  const initials = (session?.nombre || 'U')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brandText}>Encuentra<Text style={styles.brandAccent}>FCC</Text></Text>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{session?.nombre || 'Usuario'}</Text>
              <Text style={styles.email}>{session?.email || 'Sin correo registrado'}</Text>
              <View style={styles.tag}><Text style={styles.tagText}>▦  Comunidad FCC</Text></View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.facultyRow}>
            <Text style={styles.facultyIcon}>▦</Text>
            <Text style={styles.facultyName} numberOfLines={2}>{stats.faculty}</Text>
            <Pressable
              style={styles.editProfileButton}
              onPress={() => Alert.alert('Editar datos', 'Puedes actualizar tus datos desde el formulario de registro próximamente.')}>
              <Text style={styles.editProfileText}>Editar datos</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactTitle}>Impacto en la comunidad{'\n'}campus</Text>
          </View>
          <View style={styles.metrics}>
            <Metric value={loading ? '—' : String(stats.published)} label="Avisos publicados" color="#071a2f" />
            <Metric value={loading ? '—' : String(stats.recovered)} label="Objetos recuperados" color="#009b70" />
            <Metric value="100%" label="Confianza" color="#071a2f" />
          </View>
        </View>

        <View style={styles.optionsCard}>
          <OptionRow
            title="Mis facultades de interés"
            description="Recibe coincidencias de campus compartidos"
            icon="▦"
            onPress={() => Alert.alert('Facultades de interés', 'Esta opción estará disponible próximamente.')}
          />
          <View style={styles.interestTags}>
            <Text style={styles.interestTag}>✓ FCC</Text>
            <Text style={styles.interestTag}>+ Añadir facultad</Text>
          </View>
          <OptionRow
            title="Historial de publicaciones y entregas"
            description="Registros concluidos y agradecimientos"
            icon="◷"
            onPress={() => router.push('/avisos')}
          />
          <OptionRow
            title="Protocolo de entrega segura en campus"
            description="Puntos de vigilancia DAS y casetas FCC"
            icon="♢"
            onPress={() => Alert.alert('Entrega segura', 'Coordina las entregas en recepción de FCC o en una caseta de vigilancia institucional.')}
          />
          <OptionRow
            title="Ayuda y soporte técnico"
            description="Reportar fallas o dudas con la aplicación"
            icon="?"
            onPress={() => Alert.alert('Ayuda y soporte', 'Si necesitas ayuda, contacta a la administración de tu facultad.')}
            last
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
        <Text style={styles.version}>EncuentraFCC • Red de Estudiantes BUAP</Text>
      </ScrollView>
    </View>
  );
}

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function OptionRow({
  title,
  description,
  icon,
  onPress,
  last = false,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.optionRow, last && styles.optionRowLast]} onPress={onPress}>
      <View style={styles.optionIcon}><Text style={styles.optionIconText}>{icon}</Text></View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Text style={styles.optionArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f6f8fa', flex: 1 },
  content: { paddingBottom: 30, paddingHorizontal: 20 },
  header: { alignItems: 'center', borderBottomColor: '#e5eaee', borderBottomWidth: 1, flexDirection: 'row', height: 72, justifyContent: 'space-between', marginHorizontal: -20, paddingHorizontal: 20 },
  brandText: { color: '#071a2f', fontSize: 22, fontWeight: '700' },
  brandAccent: { color: '#16a1d5' },
  headerTitle: { color: '#263440', fontSize: 18 },
  profileCard: { backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 20 },
  profileTop: { alignItems: 'center', flexDirection: 'row' },
  avatar: { alignItems: 'center', backgroundColor: '#dce8f1', borderColor: '#c2d4e0', borderRadius: 45, borderWidth: 3, height: 82, justifyContent: 'center', width: 82 },
  avatarText: { color: '#0b466d', fontSize: 25, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 16 },
  name: { color: '#101b26', fontSize: 21, fontWeight: '700' },
  email: { color: '#52606d', fontSize: 14, marginTop: 3 },
  tag: { alignSelf: 'flex-start', backgroundColor: '#e6eef4', borderRadius: 8, marginTop: 9, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: '#082a4e', fontSize: 12, fontWeight: '600' },
  divider: { backgroundColor: '#e5eaee', height: 1, marginVertical: 17 },
  facultyRow: { alignItems: 'center', flexDirection: 'row' },
  facultyIcon: { color: '#526575', fontSize: 20, marginRight: 9 },
  facultyName: { color: '#52606d', flex: 1, fontSize: 14 },
  editProfileButton: { backgroundColor: '#dce8f1', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11 },
  editProfileText: { color: '#082a4e', fontSize: 13, fontWeight: '700' },
  impactCard: { backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 20 },
  impactHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  impactTitle: { color: '#101b26', fontSize: 20, fontWeight: '700', lineHeight: 25 },
  semester: { color: '#69757f', fontSize: 13 },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 18 },
  metric: { alignItems: 'center', backgroundColor: '#f0f3f5', borderColor: '#e1e6ea', borderRadius: 11, flex: 1, minHeight: 105, justifyContent: 'center', paddingHorizontal: 6 },
  metricValue: { fontSize: 25, fontWeight: '700' },
  metricLabel: { color: '#52606d', fontSize: 13, marginTop: 5, textAlign: 'center' },
  optionsCard: { backgroundColor: '#fff', borderColor: '#e1e6ea', borderRadius: 18, borderWidth: 1, marginTop: 20, overflow: 'hidden' },
  optionRow: { alignItems: 'center', borderBottomColor: '#e5eaee', borderBottomWidth: 1, flexDirection: 'row', padding: 17 },
  optionRowLast: { borderBottomWidth: 0 },
  optionIcon: { alignItems: 'center', backgroundColor: '#edf2f6', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  optionIconText: { color: '#082a4e', fontSize: 21, fontWeight: '700' },
  optionText: { flex: 1, marginLeft: 13 },
  optionTitle: { color: '#172635', fontSize: 17, fontWeight: '600' },
  optionDescription: { color: '#69757f', fontSize: 13, lineHeight: 18, marginTop: 3 },
  optionArrow: { color: '#69757f', fontSize: 28, marginLeft: 8 },
  interestTags: { flexDirection: 'row', gap: 10, paddingBottom: 15, paddingLeft: 74 },
  interestTag: { backgroundColor: '#e0edf5', borderColor: '#a8bfd1', borderRadius: 16, borderWidth: 1, color: '#082a4e', fontSize: 13, paddingHorizontal: 12, paddingVertical: 6 },
  logoutButton: { alignItems: 'center', backgroundColor: '#fde7e7', borderColor: '#f1bcbc', borderRadius: 26, borderWidth: 1, marginTop: 22, minHeight: 52, justifyContent: 'center' },
  logoutText: { color: '#bd2525', fontSize: 16, fontWeight: '700' },
  version: { color: '#69757f', fontSize: 13, fontWeight: '600', marginTop: 17, textAlign: 'center' },
});
