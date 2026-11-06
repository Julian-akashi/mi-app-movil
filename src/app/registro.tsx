import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { registerUser } from '../database';

const FACULTIES = [
  'Facultad de Ciencias de la Computación',
  'Facultad de Ingeniería',
  'Facultad de Ciencias Físico Matemáticas',
  'Facultad de Administración',
  'Otra facultad o unidad académica',
];

export default function RegistroScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [facultad, setFacultad] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();

  const crearCuenta = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!nombre.trim() || !normalizedEmail || !facultad || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa todos los campos para continuar.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica ambas contraseñas.');
      return;
    }
    if (!aceptaTerminos) {
      Alert.alert('Términos pendientes', 'Acepta los términos y condiciones para continuar.');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser(nombre, normalizedEmail, password);
      await setSession(user);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      console.error('Error inesperado durante el registro:', error);
      Alert.alert('No se pudo crear la cuenta', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/login')} accessibilityLabel="Regresar">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle}>Crear cuenta</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.logo}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>✦</Text>
            </View>
            <View>
              <Text style={styles.logoText}>
                Encuentra<Text style={styles.logoAccent}>FCC</Text>
              </Text>
              <Text style={styles.logoCaption}>CAMPUS UNIVERSITARIO</Text>
            </View>
          </View>

          <View style={styles.secureBadge}>
            <Text style={styles.secureIcon}>♢</Text>
            <Text style={styles.secureText}>Red Segura Universitaria</Text>
          </View>
          <Text style={styles.subtitle}>
            Únete a la red universitaria de objetos{'\n'}perdidos de tu facultad
          </Text>

          <View style={styles.form}>
            <FieldLabel text="Nombre completo" />
            <View style={styles.inputContainer}>
              <Text style={styles.fieldIcon}>♙</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor="#8b9aaa"
                autoCapitalize="words"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <FieldLabel text="Correo electrónico" />
            <View style={styles.inputContainer}>
              <Text style={styles.fieldIcon}>✉</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@universidad.edu"
                placeholderTextColor="#8b9aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <Text style={styles.helperText}>Usaremos este correo para identificar tu cuenta.</Text>

            <FieldLabel text="Facultad o unidad académica" />
            <Pressable
              style={styles.select}
              onPress={() => setSelectorVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar facultad">
              <Text style={styles.fieldIcon}>▦</Text>
              <Text style={[styles.selectText, !facultad && styles.placeholder]}>
                {facultad || 'Selecciona tu facultad'}
              </Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>

            <FieldLabel text="Contraseña" />
            <PasswordField
              value={password}
              placeholder="Mínimo 6 caracteres"
              visible={mostrarPassword}
              onChangeText={setPassword}
              onToggle={() => setMostrarPassword((visible) => !visible)}
              accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            />

            <FieldLabel text="Confirmación de contraseña" error={confirmPassword.length > 0 && password !== confirmPassword} />
            <PasswordField
              value={confirmPassword}
              placeholder="Repite tu contraseña"
              visible={mostrarConfirmacion}
              onChangeText={setConfirmPassword}
              onToggle={() => setMostrarConfirmacion((visible) => !visible)}
              error={confirmPassword.length > 0 && password !== confirmPassword}
              accessibilityLabel={mostrarConfirmacion ? 'Ocultar confirmación' : 'Mostrar confirmación'}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>△</Text>
                <Text style={styles.errorText}>Las contraseñas no coinciden. Verifica ambos campos.</Text>
              </View>
            )}

            <Pressable style={styles.termsRow} onPress={() => setAceptaTerminos((accepted) => !accepted)}>
              <View style={[styles.checkbox, aceptaTerminos && styles.checkboxChecked]}>
                {aceptaTerminos && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink}>Términos y Condiciones</Text> del Campus Universitario y la Política de Protección de Datos.
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={crearCuenta}
              disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear cuenta  →</Text>}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <Link href="/login" style={styles.link}>Iniciar sesión</Link>
          </View>
        </View>
      </ScrollView>

      <Modal visible={selectorVisible} transparent animationType="fade" onRequestClose={() => setSelectorVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectorVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona tu facultad</Text>
            {FACULTIES.map((option) => (
              <Pressable
                key={option}
                style={styles.option}
                onPress={() => {
                  setFacultad(option);
                  setSelectorVisible(false);
                }}>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ text, error = false }: { text: string; error?: boolean }) {
  return <Text style={[styles.label, error && styles.errorLabel]}>{text} <Text style={styles.required}>*</Text></Text>;
}

function PasswordField({
  value,
  placeholder,
  visible,
  error = false,
  onChangeText,
  onToggle,
  accessibilityLabel,
}: {
  value: string;
  placeholder: string;
  visible: boolean;
  error?: boolean;
  onChangeText: (value: string) => void;
  onToggle: () => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={[styles.inputContainer, error && styles.inputError]}>
      <Text style={styles.fieldIcon}>♙</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#8b9aaa"
        secureTextEntry={!visible}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable style={styles.eyeButton} onPress={onToggle} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        <View style={styles.eyeIcon}>
          <View style={styles.eyePupil} />
          {!visible && <View style={styles.eyeSlash} />}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#fff', flex: 1 },
  container: { flexGrow: 1, paddingBottom: 56 },
  topBar: { alignItems: 'center', borderBottomColor: '#edf0f2', borderBottomWidth: 1, flexDirection: 'row', height: 78, justifyContent: 'space-between', paddingHorizontal: 22 },
  backArrow: { color: '#071a2f', fontSize: 42, fontWeight: '300', lineHeight: 42 },
  topTitle: { color: '#071a2f', flex: 1, fontSize: 24, fontWeight: '700', marginLeft: 18 },
  topBarSpacer: { width: 38 },
  content: { alignSelf: 'center', maxWidth: 540, paddingHorizontal: 22, width: '100%' },
  logo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 30, marginTop: 54 },
  logoMark: { alignItems: 'center', backgroundColor: '#07517b', borderRadius: 8, height: 30, justifyContent: 'center', marginRight: 7, width: 30 },
  logoMarkText: { color: '#f7be35', fontSize: 18 },
  logoText: { color: '#07517b', fontSize: 13, fontWeight: '800' },
  logoAccent: { color: '#18a3d8' },
  logoCaption: { color: '#6d7f8e', fontSize: 5, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  secureBadge: { alignSelf: 'center', backgroundColor: '#e8f0f5', borderRadius: 18, flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 8 },
  secureIcon: { color: '#092746', fontSize: 16, marginRight: 8 },
  secureText: { color: '#092746', fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#293440', fontSize: 19, lineHeight: 29, marginBottom: 32, marginTop: 12, textAlign: 'center' },
  form: { width: '100%' },
  label: { color: '#141b23', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  errorLabel: { color: '#d51e25' },
  required: { color: '#c71922' },
  inputContainer: { alignItems: 'center', borderColor: '#cfd7de', borderRadius: 15, borderWidth: 1.5, flexDirection: 'row', height: 66, marginBottom: 10, paddingHorizontal: 15 },
  inputError: { borderColor: '#f0242b', borderWidth: 2 },
  fieldIcon: { color: '#33404d', fontSize: 24, marginRight: 13, width: 25 },
  input: { color: '#1b2936', flex: 1, fontSize: 18, height: '100%' },
  helperText: { color: '#52606d', fontSize: 14, marginBottom: 26, marginTop: -3 },
  select: { alignItems: 'center', borderColor: '#cfd7de', borderRadius: 15, borderWidth: 1.5, flexDirection: 'row', height: 66, marginBottom: 25, paddingHorizontal: 15 },
  selectText: { color: '#1b2936', flex: 1, fontSize: 17 },
  placeholder: { color: '#8b9aaa' },
  chevron: { color: '#455463', fontSize: 27 },
  eyeButton: { alignItems: 'center', height: 50, justifyContent: 'center', width: 35 },
  eyeIcon: { alignItems: 'center', borderColor: '#455463', borderRadius: 11, borderWidth: 2, height: 15, justifyContent: 'center', width: 24 },
  eyePupil: { backgroundColor: '#455463', borderRadius: 4, height: 6, width: 6 },
  eyeSlash: { backgroundColor: '#455463', height: 2, position: 'absolute', transform: [{ rotate: '-45deg' }], width: 27 },
  termsRow: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 22, marginTop: 12 },
  checkbox: { alignItems: 'center', borderColor: '#1c3e60', borderRadius: 5, borderWidth: 2, height: 26, justifyContent: 'center', marginRight: 14, width: 26 },
  checkboxChecked: { backgroundColor: '#0b466d' },
  checkmark: { color: '#fff', fontSize: 19, fontWeight: '800' },
  termsText: { color: '#52606d', flex: 1, fontSize: 15, lineHeight: 24 },
  termsLink: { color: '#153c61', textDecorationLine: 'underline' },
  primaryButton: { alignItems: 'center', backgroundColor: '#0b466d', borderRadius: 30, justifyContent: 'center', marginBottom: 8, minHeight: 64, shadowColor: '#0b466d', shadowOpacity: 0.22, shadowRadius: 7, elevation: 3 },
  pressed: { opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontSize: 19, fontWeight: '700' },
  errorBox: { alignItems: 'center', backgroundColor: '#fff1f1', borderColor: '#ffb8bb', borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginBottom: 18, padding: 12 },
  errorIcon: { color: '#f0242b', fontSize: 21, marginRight: 10 },
  errorText: { color: '#ed252b', flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: '#4d5964', fontSize: 16 },
  link: { color: '#092f53', fontSize: 16, fontWeight: '700', marginLeft: 6 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.35)', flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, maxWidth: 500, padding: 20, width: '100%' },
  modalTitle: { color: '#092746', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  option: { borderBottomColor: '#e5eaee', borderBottomWidth: 1, paddingVertical: 15 },
  optionText: { color: '#263440', fontSize: 16 },
});
