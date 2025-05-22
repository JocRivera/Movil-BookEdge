// MiAppMovil/app/_layout.js
import React from 'react';
import { Slot, SplashScreen } from 'expo-router'; // Slot renderizará la pantalla actual
import { AuthProvider, useAuth } from '../src/context/AuthContext'; // Ajusta la ruta si moviste src
import { StatusBar } from 'react-native';
import AppNavigatorContent from '../src/navigation/AppNavigator'; // Un nuevo componente que crearemos
import Toast from 'react-native-toast-message'; // Importar

// Previene que la pantalla de splash se oculte automáticamente hasta que estemos listos
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuth(); // Obtenemos isLoading del contexto

  React.useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync(); // Oculta la pantalla de splash cuando el contexto ha cargado
    }
  }, [isLoading]);

  if (isLoading) {
    // Mientras el AuthContext está cargando (verificando token),
    // podrías mostrar la SplashScreen de Expo Router o un componente de carga simple.
    // Con preventAutoHideAsync, la splash nativa se mantendrá.
    return null;
  }

  // AppNavigatorContent decidirá qué mostrar (Auth o App screens)
  return <AppNavigatorContent />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
         <Toast /> 
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
      <RootLayoutNav />
    </AuthProvider>
  );
}