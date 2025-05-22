import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  // Button, // No lo estamos usando directamente
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image, // Para el logo
  KeyboardAvoidingView, // Para evitar que el teclado tape los inputs
  Platform, // Para ajustes específicos de plataforma
  ScrollView, // Para permitir scroll si el contenido es mucho
} from 'react-native';
import { loginUser } from '../services/authMobileService';
import { AuthContext } from '../context/AuthContext';

import  AppLogo from "../../assets/logo.png"
// src/screens/LoginScreen.js
// ... (importaciones) ...

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // <--- VAMOS A USAR ESTE ESTADO

  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    setError(null); // Limpiar errores previos al intentar de nuevo
    if (!email.trim() || !password.trim()) {
      // Podemos mostrar este error en la UI también, o mantener el Alert
      setError('Por favor, ingresa tu correo y contraseña.');
      // Alert.alert('Entrada Inválida', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    const result = await loginUser(email, password);
    setIsLoading(false);

    if (result.success) {
      await signIn(result.user, result.token, result.refreshToken);
    } else {
      setError(result.message || 'Ocurrió un error desconocido.'); // <--- ESTABLECE EL ERROR AQUÍ
      // Ya no necesitas el Alert aquí si muestras el error en la UI
      // Alert.alert('Error de Login', result.message || 'Ocurrió un error desconocido.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" // Para que el teclado no se cierre al tocar fuera de un input
      >
        <View style={styles.container}>
          <Image source={AppLogo} style={styles.logo} />
          <Text style={styles.title}>Bienvenido</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error && (email.trim() === '' || password.trim() === '') ? styles.inputError : {}]} // Estilo de error si hay error y los campos están vacíos
              placeholder="Correo electrónico"
              value={email}
              onChangeText={(text) => { setEmail(text); if(error) setError(null); }} // Limpiar error al escribir
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#a0aec0"
              textContentType="emailAddress"
            />
            <TextInput
              style={[styles.input, error && (email.trim() === '' || password.trim() === '') ? styles.inputError : {}]} // Estilo de error
              placeholder="Contraseña"
              value={password}
              onChangeText={(text) => { setPassword(text); if(error) setError(null); }} // Limpiar error al escribir
              secureTextEntry
              placeholderTextColor="#a0aec0"
              textContentType="password"
            />
          </View>

          {/* Mostrar el mensaje de error aquí */}
          {error && !isLoading && ( // Mostrar solo si no está cargando
            <Text style={styles.errorText}>{error}</Text>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color="#3182ce" style={styles.loader} />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// src/screens/LoginScreen.js -> CONTINUACIÓN (ESTILOS AJUSTADOS)

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#e2e8f0', // Un gris azulado muy claro, más profesional que blanco puro
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Centra el contenido verticalmente en el ScrollView
  },
  container: {
    // flex: 1, // No es necesario si scrollContainer ya tiene flexGrow: 1 y justifyContent: 'center'
    alignItems: 'center',
    paddingHorizontal: 40, // Un poco más de padding horizontal
    paddingVertical: 30,   // Padding vertical
  },
  logo: {
    width: 180, // Ligeramente más pequeño si el original era muy grande
    height: 180,
    resizeMode: 'contain',
    marginBottom: 25, // Reducido el margen inferior
  },
  title: {
    fontSize: 26, // Ligeramente más pequeño
    fontWeight: '600', // Un poco menos bold
    color: '#2d3748', // Un gris oscuro para el texto
    textAlign: 'center',
    marginBottom: 30, // Espacio antes de los inputs
  },

  inputContainer: {
    width: '100%',
    marginBottom: 10, // Reducir margen si el error va después
  },
  input: {
    backgroundColor: '#fff',
    color: '#2d3748', // Texto oscuro
    paddingHorizontal: 18, // Un poco más de padding interno
    paddingVertical: 14,
    borderRadius: 8, // Bordes suaves
    marginBottom: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#cbd5e0', // Borde gris claro
    shadowColor: "#000", // Sombra sutil para inputs
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.05,
    shadowRadius: 2.00,
    elevation: 1,
  },
  inputError: { // Estilo para cuando hay error en el input
    borderColor: '#e53e3e', // Borde rojo
    backgroundColor: '#fed7d740' // Fondo rojo muy claro y translúcido
  },
  errorText: { // Para mostrar el error del login
    color: '#c53030', // Rojo oscuro para el texto del error
    textAlign: 'center',
    marginBottom: 15, // Espacio antes del botón
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007bff', // Azul primario
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 5, // Reducido si el errorText ya da espacio
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3, }, // Sombra un poco más notoria
    shadowOpacity: 0.20,
    shadowRadius: 4.0,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17, // Ligeramente más pequeño
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20, // Espacio vertical para el loader
  },
  linksContainer: {
    marginTop: 25, // Espacio antes de los links
    width: '100%',
    alignItems: 'center', // Centrar el link de "Olvidaste contraseña"
  },
  linkText: {
    color: '#007bff', // Mismo azul que el botón
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;