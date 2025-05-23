// src/screens/LoginScreen.js
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/authMobileService';

import AppLogo from "../../assets/logo.jpg"; 
import BackgroundImage from '../../assets/fondo3.jpg';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    // ... (tu lógica de handleLogin sin cambios)
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setIsLoading(true);
    const result = await loginUser(email, password);
    setIsLoading(false);
    if (result.success) {
      await signIn(result.user, result.token, result.refreshToken);
    } else {
      setError(result.message || 'Ocurrió un error desconocido.');
    }
  };

  return (
    <ImageBackground // <--- ENVOLTORIO PRINCIPAL
      source={BackgroundImage}
      style={styles.backgroundImage} // Estilo para que ocupe toda la pantalla
      resizeMode="cover" // 'cover' para llenar, 'stretch' para estirar, 'contain' para ajustar
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.overlay}> {/* Opcional: Un overlay para mejorar legibilidad del texto */}
            <View style={styles.container}>
              <View style={styles.logoContainer}>
                <Image source={AppLogo} style={styles.logoImage} />
              </View>

              <Text style={styles.title}>Bienvenido</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, error && (email.trim() === '' || password.trim() === '') ? styles.inputError : {}]}
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={(text) => { setEmail(text); if(error) setError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#a0aec0" // Ajusta si el fondo es claro
                  textContentType="emailAddress"
                />
                <TextInput
                  style={[styles.input, error && (email.trim() === '' || password.trim() === '') ? styles.inputError : {}]}
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={(text) => { setPassword(text); if(error) setError(null); }}
                  secureTextEntry
                  placeholderTextColor="#a0aec0" // Ajusta si el fondo es claro
                  textContentType="password"
                />
              </View>

              {error && !isLoading && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {isLoading ? (
                <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Ingresar</Text>
                </TouchableOpacity>
              )}

              <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => Alert.alert("Info", "Navegar a olvido de contraseña")}>
                  <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { // Estilo para ImageBackground
    flex: 1, // Ocupa toda la pantalla
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    // backgroundColor: 'transparent', // El fondo lo da ImageBackground
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  overlay: { // Opcional: para mejorar contraste del texto sobre la imagen
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Overlay oscuro semitransparente
    // Si tu imagen de fondo es clara y los textos son oscuros, podrías usar:
    // backgroundColor: 'rgba(255, 255, 255, 0.3)', // Overlay claro semitransparente
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    // backgroundColor: 'transparent', // El fondo lo da ImageBackground o el overlay
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    // backgroundColor: '#fff', // Quita esto si quieres que se vea el fondo de la imagen principal
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28, // Ajusta según el nuevo fondo
    fontWeight: 'bold',
    color: '#fff', // Texto blanco para contraste con overlay oscuro
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Sombra para el texto
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo blanco semitransparente para inputs
    color: '#2d3748', // Texto oscuro
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borde claro
  },
  inputError: {
    borderColor: '#ff6b6b', // Un rojo más brillante para el error
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  errorText: {
    color: '#ffdddd', // Texto de error claro para fondo oscuro
    backgroundColor: 'rgba(200, 0, 0, 0.5)', // Fondo semitransparente para el error
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10, // Ajustado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3, },
    shadowOpacity: 0.20,
    shadowRadius: 4.0,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  linksContainer: {
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
  },
  linkText: {
    color: '#d1d5db', // Texto de link claro para fondo oscuro
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Sombra para el texto
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default LoginScreen;