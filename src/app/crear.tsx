import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../contexts/auth-context';
import { CATEGORIES, FACULTIES } from '../constants/catalogs';
import { createObject, getObjectById, updateObject } from '../database';

const STATES = ['pendiente', 'cerrado'];

export default function CrearObjetoScreen() {
  const [tipoAviso, setTipoAviso] = useState<'perdi' | 'encontre'>('perdi');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [facultad, setFacultad] = useState('');
  const [lugar, setLugar] = useState('');
  const [fechaSuceso, setFechaSuceso] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [calendarioVisible, setCalendarioVisible] = useState(false);
  const [contacto, setContacto] = useState('');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [selector, setSelector] = useState<'categoria' | 'facultad' | 'estado' | null>(null);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const editingId = typeof id === 'string' ? id : undefined;

  useEffect(() => {
    if (!editingId) {
      return;
    }

    getObjectById(editingId)
      .then((object) => {
        if (!object) {
          Alert.alert('Aviso no encontrado', 'El objeto ya no está disponible.');
          router.back();
          return;
        }
        if (!session || object.usuario_id !== session.id) {
          Alert.alert('Acceso no permitido', 'Solo puedes editar tus propios avisos.');
          router.back();
          return;
        }
        setTipoAviso(object.tipo_aviso as 'perdi' | 'encontre');
        setTitulo(object.titulo);
        setDescripcion(object.descripcion);
        setCategoria(object.categoria);
        setEstado(object.estado);
        setFacultad(object.facultad);
        setLugar(object.lugar);
        setFechaSuceso(object.fecha_suceso);
        setContacto(object.contacto);
        setImagenUri(object.imagen_url || null);
      })
      .catch((error) => {
        console.error('Error al cargar el aviso para editar:', error);
        Alert.alert('No se pudo cargar el aviso', 'Intenta nuevamente.');
      });
  }, [editingId, router, session]);

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagenUri(result.assets[0].uri);
    }
  };

  const limpiarFormulario = () => {
    setTipoAviso('perdi');
    setTitulo('');
    setDescripcion('');
    setCategoria('');
    setEstado('pendiente');
    setFacultad('');
    setLugar('');
    setFechaSuceso('');
    setFechaSeleccionada(new Date());
    setCalendarioVisible(false);
    setContacto('');
    setImagenUri(null);
    setSelector(null);
  };

  const guardarObjeto = async () => {
    if (!session) {
      Alert.alert('Sesión requerida', 'Inicia sesión para publicar un aviso.');
      return;
    }
    if (!titulo.trim() || !categoria || !facultad || !lugar.trim() || !fechaSuceso.trim() || !descripcion.trim() || !contacto.trim()) {
      Alert.alert('Campos incompletos', 'Completa todos los campos obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      const object = {
        titulo,
        descripcion,
        categoria,
        tipo_aviso: tipoAviso,
        facultad,
        lugar,
        fecha_suceso: fechaSuceso,
        contacto,
        imagen_url: imagenUri ?? '',
        usuario_id: session.id,
        estado,
      };
      if (editingId) {
        await updateObject(editingId, session.id, object);
      } else {
        await createObject(object);
      }
      limpiarFormulario();
      Alert.alert(editingId ? '¡Aviso actualizado!' : '¡Aviso publicado!', 'Los cambios se guardaron correctamente.');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el aviso.';
      Alert.alert('Error', message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFecha = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setCalendarioVisible(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    setFechaSeleccionada(date);
    setFechaSuceso(date.toLocaleDateString('es-MX'));
    if (Platform.OS === 'ios') {
      setCalendarioVisible(false);
    }
  };

  const options = selector === 'categoria' ? CATEGORIES : selector === 'facultad' ? FACULTIES : STATES;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Regresar">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle}>{editingId ? 'Editar aviso' : 'Reportar objeto'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.introRow}>
            <View>
              <Text style={styles.introTitle}>Nuevo aviso de campus</Text>
              <Text style={styles.introText}>Publica para la comunidad{'\n'}universitaria</Text>
            </View>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>* Campos{'\n'}obligatorios</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Tipo de aviso <Text style={styles.required}>*</Text></Text>
          <View style={styles.noticeRow}>
            <NoticeCard
              icon="⌕"
              title="Perdí un objeto"
              description="Busco algo que extravié"
              selected={tipoAviso === 'perdi'}
              onPress={() => setTipoAviso('perdi')}
            />
            <NoticeCard
              icon="▣"
              title="Encontré un objeto"
              description="Tengo algo ajeno en custodia"
              selected={tipoAviso === 'encontre'}
              onPress={() => setTipoAviso('encontre')}
            />
          </View>

          <FormLabel text="Nombre o título del objeto" required />
          <TextInput style={styles.input} placeholder="Ej: Mochila azul con termo metálico" placeholderTextColor="#9aa5ae" value={titulo} onChangeText={setTitulo} />

          <FormLabel text="Facultad o Dependencia" required />
          <SelectField value={facultad} placeholder="Selecciona una facultad" onPress={() => setSelector('facultad')} />
          <Text style={styles.note}>ⓘ La lista se actualiza según tu campus universitario</Text>

          <FormLabel text="Lugar específico" required />
          <TextInput style={styles.input} placeholder="Ej: Laboratorio 3, Edificio, pasillo principal" placeholderTextColor="#9aa5ae" value={lugar} onChangeText={setLugar} />
          <View style={styles.infoBox}><Text style={styles.infoIcon}>ⓘ</Text><Text style={styles.infoText}>Recuerda verificar el lugar exacto para facilitar la localización inmediata del objeto.</Text></View>

          <FormLabel text="Descripción detallada" required />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Describe detalles específicos, marcas, rayones, stickers, contenido o características distintivas que permitan corroborar propiedad..." placeholderTextColor="#9aa5ae" multiline value={descripcion} onChangeText={setDescripcion} />

          <FormLabel text="Medio de contacto o indicaciones de entrega" required />
          <TextInput
            style={styles.input}
            placeholder="Ej: Dejándolo en recepción del edificio"
            placeholderTextColor="#9aa5ae"
            value={contacto}
            onChangeText={setContacto}
          />
          <Text style={styles.privacy}>Protegemos tu privacidad: puedes indicar una oficina o ventanilla oficial.</Text>

          <FormLabel text="Categoría" required />
          <SelectField value={categoria} placeholder="Selecciona una categoría" onPress={() => setSelector('categoria')} />

          <FormLabel text="Estado del aviso" required />
          <SelectField
            value={formatState(estado)}
            placeholder="Selecciona un estado"
            onPress={() => setSelector('estado')}
          />

          <FormLabel text="Fecha del suceso" required />
          <Pressable
            style={styles.input}
            onPress={() => setCalendarioVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar fecha del suceso">
            <Text style={[styles.selectValue, !fechaSuceso && styles.placeholder]}>
              {fechaSuceso || 'Selecciona una fecha'}
            </Text>
            <Text style={styles.calendarIcon}>▣</Text>
          </Pressable>

          <View style={styles.fieldHeading}>
            <Text style={styles.sectionLabel}>Fotografía del objeto</Text>
            <Text style={styles.recommended}>Recomendado</Text>
          </View>
          <Pressable style={styles.uploadBox} onPress={seleccionarImagen}>
            {imagenUri ? (
              <Image source={{ uri: imagenUri }} style={styles.preview} />
            ) : (
              <>
                <View style={styles.uploadIcon}><Text style={styles.cameraIcon}>▣</Text></View>
                <Text style={styles.uploadTitle}>Subir imagen desde galería</Text>
                <Text style={styles.uploadHint}>Formatos JPG, PNG (máx. 5MB)</Text>
                <View style={styles.addFile}><Text style={styles.addFileText}>＋  Agregar archivo</Text></View>
              </>
            )}
          </Pressable>

          <Pressable style={({ pressed }) => [styles.publishButton, pressed && styles.pressed]} onPress={guardarObjeto} disabled={guardando}>
            <Text style={styles.publishText}>
              {guardando ? 'Guardando...' : editingId ? 'Guardar cambios' : '⚑  Publicar aviso'}
            </Text>
          </Pressable>
          <Pressable style={styles.draftButton} onPress={() => Alert.alert('Borrador', 'Los borradores estarán disponibles próximamente.')}>
            <Text style={styles.draftText}>▣  Guardar borrador</Text>
          </Pressable>
        </View>
      </ScrollView>

      {calendarioVisible && (
        <DateTimePicker
          value={fechaSeleccionada}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={cambiarFecha}
          maximumDate={new Date()}
        />
      )}

      <Modal visible={selector !== null} transparent animationType="fade" onRequestClose={() => setSelector(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelector(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selector === 'categoria'
                ? 'Selecciona una categoría'
                : selector === 'facultad'
                  ? 'Selecciona una facultad'
                  : 'Selecciona un estado'}
            </Text>
            {options.map((option) => (
              <Pressable key={option} style={styles.option} onPress={() => {
                if (selector === 'categoria') setCategoria(option);
                else if (selector === 'facultad') setFacultad(option);
                else setEstado(option);
                setSelector(null);
              }}>
                <Text style={styles.optionText}>{selector === 'estado' ? formatState(option) : option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function FormLabel({ text, required = false }: { text: string; required?: boolean }) {
  return <Text style={styles.formLabel}>{text}{required && <Text style={styles.required}> *</Text>}</Text>;
}

function SelectField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable style={styles.input} onPress={onPress}>
      <Text style={[styles.selectValue, !value && styles.placeholder]}>{value || placeholder}</Text>
      <Text style={styles.selectArrow}>⌄</Text>
    </Pressable>
  );
}

function formatState(value: string) {
  if (value === 'cerrado') return 'Cerrado';
  return 'Pendiente';
}

function NoticeCard({ icon, title, description, selected, onPress }: { icon: string; title: string; description: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.noticeCard, selected && styles.noticeSelected]} onPress={onPress}>
      <View style={styles.noticeIcon}><Text style={styles.noticeIconText}>{icon}</Text></View>
      <View style={styles.noticeCheck}>{selected && <Text style={styles.checkmark}>✓</Text>}</View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f7f9fa', flex: 1 },
  container: { flexGrow: 1, paddingBottom: 36 },
  topBar: { alignItems: 'center', backgroundColor: '#fff', borderBottomColor: '#e6ebef', borderBottomWidth: 1, flexDirection: 'row', height: 54, justifyContent: 'space-between', paddingHorizontal: 15 },
  backArrow: { color: '#071a2f', fontSize: 38, lineHeight: 38 },
  topTitle: { color: '#071a2f', flex: 1, fontSize: 18, fontWeight: '700', marginLeft: 17 },
  cancel: { color: '#1e2935', fontSize: 13 },
  content: { alignSelf: 'center', maxWidth: 620, paddingHorizontal: 15, width: '100%' },
  introRow: { borderBottomColor: '#e1e7eb', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18 },
  introTitle: { color: '#09213c', fontSize: 15, fontWeight: '600' },
  introText: { color: '#5d6871', fontSize: 12, lineHeight: 20, marginTop: 4 },
  requiredBadge: { alignSelf: 'center', backgroundColor: '#e9edf0', borderRadius: 22, paddingHorizontal: 13, paddingVertical: 7 },
  requiredText: { color: '#475360', fontSize: 11, lineHeight: 15 },
  sectionLabel: { color: '#08213d', fontSize: 14, fontWeight: '600' },
  required: { color: '#d51e25' },
  noticeRow: { flexDirection: 'row', gap: 12, marginBottom: 23, marginTop: 6 },
  noticeCard: { backgroundColor: '#fff', borderColor: '#dce2e7', borderRadius: 15, borderWidth: 1, flex: 1, minHeight: 145, padding: 15 },
  noticeSelected: { borderColor: '#092e61', borderWidth: 2 },
  noticeIcon: { alignItems: 'center', backgroundColor: '#edf2f7', borderRadius: 22, height: 43, justifyContent: 'center', width: 43 },
  noticeIconText: { color: '#092e61', fontSize: 25 },
  noticeCheck: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#d5dce2', borderRadius: 12, borderWidth: 2, height: 23, justifyContent: 'center', position: 'absolute', right: 14, top: 16, width: 23 },
  noticeTitle: { color: '#071525', fontSize: 16, fontWeight: '700', marginTop: 17 },
  noticeDescription: { color: '#5e6871', fontSize: 12, lineHeight: 17, marginTop: 4 },
  checkmark: { backgroundColor: '#0a456d', borderRadius: 10, color: '#fff', fontSize: 14, height: 20, lineHeight: 20, textAlign: 'center', width: 20 },
  fieldHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  recommended: { color: '#69757f', fontSize: 11 },
  uploadBox: { alignItems: 'center', borderColor: '#bdc8d1', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1.5, justifyContent: 'center', minHeight: 163, padding: 12 },
  uploadIcon: { alignItems: 'center', backgroundColor: '#e8f0f6', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  cameraIcon: { color: '#092e61', fontSize: 28 },
  uploadTitle: { color: '#09213c', fontSize: 15, fontWeight: '600', marginTop: 9 },
  uploadHint: { color: '#63707a', fontSize: 11, marginTop: 7 },
  addFile: { backgroundColor: '#e9edf0', borderRadius: 15, marginTop: 10, paddingHorizontal: 13, paddingVertical: 5 },
  addFileText: { color: '#344453', fontSize: 11 },
  preview: { borderRadius: 10, height: 140, resizeMode: 'cover', width: '100%' },
  formLabel: { color: '#071b33', fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 18 },
  input: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#d5dde3', borderRadius: 12, borderWidth: 1, color: '#263440', flexDirection: 'row', fontSize: 14, minHeight: 45, paddingHorizontal: 14 },
  textArea: { alignItems: 'flex-start', minHeight: 105, paddingTop: 14, textAlignVertical: 'top' },
  selectValue: { color: '#263440', flex: 1, fontSize: 14 },
  placeholder: { color: '#9aa5ae' },
  selectArrow: { color: '#53616c', fontSize: 22 },
  calendarIcon: { color: '#53616c', fontSize: 18 },
  note: { color: '#65717a', fontSize: 11, marginTop: 5 },
  infoBox: { alignItems: 'center', backgroundColor: '#f0f2f4', borderColor: '#dfe4e8', borderRadius: 10, flexDirection: 'row', marginTop: 4, padding: 10 },
  infoIcon: { color: '#344453', fontSize: 16, marginRight: 7 },
  infoText: { color: '#56636d', flex: 1, fontSize: 11 },
  privacy: { color: '#65717a', fontSize: 11, marginTop: 5 },
  publishButton: { alignItems: 'center', backgroundColor: '#0b466d', borderRadius: 24, justifyContent: 'center', marginTop: 28, minHeight: 47 },
  publishText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  draftButton: { alignItems: 'center', backgroundColor: '#dce8f1', borderRadius: 24, justifyContent: 'center', marginTop: 12, minHeight: 43 },
  draftText: { color: '#092e61', fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,.35)', flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, maxWidth: 500, padding: 20, width: '100%' },
  modalTitle: { color: '#09213c', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  option: { borderBottomColor: '#e4e9ed', borderBottomWidth: 1, paddingVertical: 14 },
  optionText: { color: '#263440', fontSize: 15 },
});
