// src/screens/SplashScreen.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';

// Opcional: Si tienes un logo para el splash
import LogoImage from '../../assets/logo.png'; // Descomenta y ajusta la ruta

const SplashScreen = () => (
  <View style={styles.container}>
    {LogoImage && <Image source={LogoImage} style={styles.logo} />}
    <ActivityIndicator size="large" color="#007bff" />
    <Text style={styles.loadingText}>Cargando aplicación...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // O el color de fondo de tu marca
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  }
});

export default SplashScreen;