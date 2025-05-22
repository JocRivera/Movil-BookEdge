// src/screens/HomeScreen.js
import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import FeatherIcon from "react-native-vector-icons/Feather"; // Asumiendo que quieres iconos

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext); // Ya no necesitamos signOut aquí

  useEffect(() => {
    if (user) {
      navigation.setOptions({
        headerTitleAlign: "left",
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerUserName}>
              {user.name ? user.name.split(" ")[0] : user.email}
            </Text>
          </View>
        ),
      });
    }
  }, [navigation, user]);

  const menuItems = [
    {
      id: "alojamientos",
      title: "Alojamientos",
      iconName: "home", // Icono de Feather para alojamientos/home
      screen: "AlojamientosFlow", // Navegará al Stack de Alojamientos
      description: "Explora y gestiona nuestras cabañas y habitaciones.",
      color: "#3498db",
    },
    {
      id: "reservas",
      title: "Mis Reservas",
      iconName: "calendar", // Icono de Feather para calendario/reservas
      screen: "MisReservas", // Necesitarás crear esta pantalla y su flujo
      description: "Consulta y administra tus próximas estadías.",
      color: "#ffc300",
    },
  ];

 const handleNavigate = (item) => {
    if (item.id === "alojamientos") { // Usar el 'id' del menuItem para identificar
      navigation.navigate("AlojamientosList"); // <--- NAVEGA DIRECTAMENTE
    } else if (item.screen === "MisReservas") { // Si tuvieras esta pantalla
      // navigation.navigate(item.screen); // Necesitarías añadirla al MainAppStack también
      Alert.alert("Navegación", `Ir a la pantalla: ${item.screen}`);
    } else {
      Alert.alert("Próximamente", "Esta función estará disponible pronto.");
    }
  };
  
  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.container}>
          <Text style={styles.mainTitle}>Panel de Control</Text>
          <Text style={styles.subTitle}>
            Bienvenido, accede a las funciones principales.
          </Text>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuCard, { borderLeftColor: item.color }]}
                onPress={() => handleNavigate(item)}
              >
                <View style={styles.cardIconContainer}>
                  <FeatherIcon name={item.iconName} size={30} color={item.color} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: item.color }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle}>{item.description}</Text>
                </View>
                <View style={styles.cardArrowContainer}>
                    <FeatherIcon name="chevron-right" size={24} color="#d0d0d0" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerTitleContainer: {
    flexDirection: "column",
    marginLeft: Platform.OS === "ios" ? 0 : -5,
  },
  headerGreeting: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  mainTitle: {
    fontSize: 28, // Más grande
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 35, // Más espacio
  },
  menuGrid: {
    // ...
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10, // Bordes más suaves
    padding: 20,
    marginBottom: 20, // Más espaciado
    borderLeftWidth: 6, // Borde izquierdo más grueso
    flexDirection: 'row', // Para icono, texto y flecha
    alignItems: 'center', // Centrar verticalmente
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  cardIconContainer: {
    marginRight: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)', // Fondo sutil para el icono
    borderRadius: 25, // Círculo
  },
  cardTextContainer: {
    flex: 1, // Para que ocupe el espacio disponible
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold", // 'bold' para más impacto
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14, // Un poco más grande
    color: "#6c757d", // Gris más oscuro
    lineHeight: 20,
  },
  cardArrowContainer: {
    marginLeft: 15,
  }
  // Estilos de logoutButton eliminados
});

export default HomeScreen;