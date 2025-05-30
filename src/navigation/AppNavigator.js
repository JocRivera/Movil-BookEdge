// src/navigation/AppNavigatorContent.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useContext } from "react";
import { Platform } from "react-native";
import FeatherIcon from 'react-native-vector-icons/Feather'; // Para iconos de Tabs
import { AuthContext } from "../context/AuthContext";
import AccommodationDetailScreen from "../screens/AccommodationDetailScreen";
import AlojamientosScreen from "../screens/AlojamientosScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SplashScreenComponent from "../screens/SplashScreen";
import UserProfileScreen from '../screens/UserProfileScreen'; // Importar Perfil

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Stack para el flujo que NO es parte de los Tabs principales ---
// Por ejemplo, el flujo de Alojamientos que se inicia desde HomeScreen
const MainAppStack = createStackNavigator();

function MainAppFlowNavigator() {
  return (
    <MainAppStack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: "#FFFFFF", elevation: 1, shadowOpacity: 0.1 },
            headerTintColor: "#2c3e50",
            headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        }}
    >
        {/* La HomeScreen (con las cards) es la raíz de este stack */}
        <MainAppStack.Screen
            name="HomeDashboard" // Diferente de InicioTab para evitar conflictos
            component={HomeScreen}
            // El título se establece dinámicamente en HomeScreen
        />
        <MainAppStack.Screen
            name="AlojamientosList"
            component={AlojamientosScreen}
            options={{ title: "Alojamientos" }}
        />
        <MainAppStack.Screen
            name="AccommodationDetail"
            component={AccommodationDetailScreen}
            // options={({ route }) => ({ title: route.params.accommodationName || 'Detalle' })}
        />
        {/* Aquí podrían ir otras pantallas que se navegan desde HomeScreen pero no son tabs */}
    </MainAppStack.Navigator>
  )
}


// --- Stack para cuando el usuario NO está autenticado ---
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// --- Navegador de Pestañas para cuando el usuario SÍ está autenticado ---
const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: "#FFFFFF", elevation: 1, shadowOpacity: 0.1, borderBottomWidth: Platform.OS === 'ios' ? 0 : 1, borderBottomColor: '#f0f0f0' },
      headerTintColor: "#2c3e50",
      headerTitleStyle: { fontWeight: "600", fontSize: 18 },
      tabBarActiveTintColor: "#007bff",
      tabBarInactiveTintColor: "#6c757d", // Un gris más estándar
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500', paddingBottom: Platform.OS === 'ios' ? 0 : 5 }, // Ajuste para iOS
      tabBarStyle: {
        paddingTop: 5,
        height: Platform.OS === 'ios' ? 85 : 60, // Más alto en iOS por el notch
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0', // Borde superior más sutil
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "InicioTab") {
          iconName = focused ? "home" : "home";
        } else if (route.name === "PerfilTab") {
          iconName = focused ? "user" : "user";
        }
        return <FeatherIcon name={iconName} size={focused ? 24 : 22} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="InicioTab"
      component={MainAppFlowNavigator} // <--- HomeScreen (con cards) ahora está dentro de un Stack
      options={{
        tabBarLabel: "Inicio",
        headerShown: false, // El MainAppFlowNavigator manejará su propio header
      }}
    />
    <Tab.Screen
      name="PerfilTab"
      component={UserProfileScreen}
      options={{
        title: "Mi Perfil",
        tabBarLabel: "Perfil",
        // El header de UserProfileScreen se mostrará por defecto
      }}
    />
  </Tab.Navigator>
);

const AppNavigatorContent = () => {
  const { token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <SplashScreenComponent />;
  }

  return token ? <AppTabs /> : <AuthStack />;
};

export default AppNavigatorContent;