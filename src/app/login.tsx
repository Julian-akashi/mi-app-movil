import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loginUser } from '../database';
import { useAuth } from '../contexts/auth-context';
import { useAppTheme } from '../contexts/theme-context';

export default function LoginScreen() {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();

  const iniciarSesion = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(normalizedEmail, password);
      await setSession(user);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      Alert.alert('No se pudo iniciar sesión', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, isDark && styles.darkScreen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.institutionBadge}>
            <Text style={styles.badgeIcon}>⌂</Text>
            <Text style={styles.institutionBadgeText}>Comunidad Universitaria FCC</Text>
          </View>

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

          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              La plataforma universitaria para reportar, localizar y recuperar objetos extraviados
              en tu campus.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@alumno.buap.mx"
                placeholderTextColor="#8b9aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>♙</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#8b9aaa"
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setMostrarPassword((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <View style={styles.eyeIcon}>
                  <View style={styles.eyePupil} />
                  {!mostrarPassword && <View style={styles.eyeSlash} />}
                </View>
              </Pressable>
            </View>

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberOption}
                onPress={() => Alert.alert('Recordar sesión', 'La sesión ya se guarda automáticamente en este dispositivo.')}>
                <View style={styles.checkbox} />
                <Text style={styles.optionText}>Recordar sesión</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert('Recuperar contraseña', 'Esta opción estará disponible próximamente.')}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={iniciarSesion}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                  <Text style={styles.primaryButtonArrow}>→</Text>
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>¿NO TIENES CUENTA?</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.institutionButton, pressed && styles.pressed]}
              onPress={() => router.push('/registro')}>
              <Text style={styles.institutionIcon}>＋</Text>
              <Text style={styles.institutionButtonText}>Crear cuenta</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
            <Link href="/registro" style={styles.link}>
              Crear cuenta
            </Link>
          </View>
          <Text style={styles.securityText}>♙ Acceso seguro • Red Universitaria FCC</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#eef2f5', flex: 1 },
  darkScreen: { backgroundColor: '#101820' },
  container: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: 16 },
  content: { maxWidth: 430, width: '100%' },
  institutionBadge: { alignSelf: 'center', backgroundColor: '#dceaf3', borderRadius: 14, flexDirection: 'row', marginBottom: 36, paddingHorizontal: 12, paddingVertical: 6 },
  badgeIcon: { color: '#0d4b73', fontSize: 12, marginRight: 5 },
  institutionBadgeText: { color: '#0d4b73', fontSize: 10, fontWeight: '700' },
  logo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 34 },
  logoMark: { alignItems: 'center', backgroundColor: '#07517b', borderRadius: 8, height: 32, justifyContent: 'center', marginRight: 8, width: 32 },
  logoMarkText: { color: '#f7be35', fontSize: 20 },
  logoText: { color: '#07517b', fontSize: 13, fontWeight: '800' },
  logoAccent: { color: '#18a3d8' },
  logoCaption: { color: '#6d7f8e', fontSize: 5, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  header: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 12 },
  title: { color: '#0b1722', fontSize: 23, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#526575', fontSize: 12, lineHeight: 18, maxWidth: 340, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderColor: '#e1e7eb', borderRadius: 20, borderWidth: 1, padding: 18, shadowColor: '#19344a', shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  label: { color: '#14364f', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  inputContainer: { alignItems: 'center', backgroundColor: '#f1f3f5', borderColor: '#d8e0e6', borderRadius: 10, borderWidth: 1, flexDirection: 'row', height: 38, marginBottom: 16, paddingHorizontal: 10 },
  inputIcon: { color: '#46667d', fontSize: 15, marginRight: 9, width: 16 },
  input: { color: '#223c50', flex: 1, fontSize: 12, height: '100%', padding: 0 },
  eyeButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 28 },
  eyeIcon: { alignItems: 'center', borderColor: '#607688', borderRadius: 10, borderWidth: 1.5, height: 12, justifyContent: 'center', width: 20 },
  eyePupil: { backgroundColor: '#607688', borderRadius: 3, height: 5, width: 5 },
  eyeSlash: { backgroundColor: '#607688', height: 1.5, position: 'absolute', transform: [{ rotate: '-45deg' }], width: 22 },
  optionsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17 },
  rememberOption: { alignItems: 'center', flexDirection: 'row' },
  checkbox: { borderColor: '#d1dce3', borderRadius: 3, borderWidth: 1, height: 13, marginRight: 6, width: 13 },
  optionText: { color: '#728391', fontSize: 9 },
  forgotText: { color: '#143e5f', fontSize: 9, fontWeight: '700' },
  primaryButton: { alignItems: 'center', backgroundColor: '#0b466d', borderRadius: 22, flexDirection: 'row', justifyContent: 'center', minHeight: 38, shadowColor: '#0b466d', shadowOpacity: 0.22, shadowRadius: 6, elevation: 3 },
  pressed: { opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  primaryButtonArrow: { color: '#fff', fontSize: 19, marginLeft: 10, marginTop: -2 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', marginVertical: 16 },
  divider: { backgroundColor: '#e6eaed', flex: 1, height: 1 },
  dividerText: { color: '#526575', fontSize: 8, marginHorizontal: 10 },
  institutionButton: { alignItems: 'center', borderColor: '#d8e0e6', borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 37 },
  institutionIcon: { color: '#07517b', fontSize: 16, marginRight: 8 },
  institutionButtonText: { color: '#263d4d', fontSize: 10, fontWeight: '600' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
  footerText: { color: '#526575', fontSize: 11 },
  link: { color: '#0b466d', fontSize: 11, fontWeight: '800', marginLeft: 5 },
  securityText: { color: '#80909c', fontSize: 9, marginTop: 12, textAlign: 'center' },
});
