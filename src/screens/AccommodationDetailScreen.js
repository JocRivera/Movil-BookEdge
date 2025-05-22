// src/screens/AccommodationDetailScreen.js
import React, { useEffect, useState, useRef } from "react"; // Importar useRef
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  Platform, // Para ajustes específicos de plataforma
  // TouchableOpacity, // No se usa si quitamos el botón de reserva
  Alert,
} from "react-native";
import { getAccommodationDetailsById } from "../services/accommodationService";
import FeatherIcon from 'react-native-vector-icons/Feather'; // Asumiendo que quieres Feather Icons

const DEFAULT_PLACEHOLDER_IMAGE_DETAIL =
  "https://via.placeholder.com/600x400.png?text=No+Imagen";
const screenWidth = Dimensions.get("window").width;

const AccommodationDetailScreen = ({ route, navigation }) => {
  const params = route?.params || {};
  const { accommodationId, accommodationType, accommodationName } = params;

  const [accommodation, setAccommodation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const flatListRef = useRef(null); // Referencia para el FlatList del carrusel

  useEffect(() => {
    if (accommodationName) {
      navigation.setOptions({ title: accommodationName });
    } else if (accommodation?.name) {
      navigation.setOptions({ title: accommodation.name });
    }
  }, [navigation, accommodationName, accommodation]);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAccommodationDetailsById(
          accommodationId,
          accommodationType
        );
        if (result.success && result.data) {
          setAccommodation(result.data);
          const primaryIdx =
            result.data.allImages?.findIndex((img) => img.isPrimary) ?? 0;
          const validPrimaryIdx = primaryIdx >= 0 && result.data.allImages && primaryIdx < result.data.allImages.length ? primaryIdx : 0;
          setSelectedImageIndex(validPrimaryIdx);

          // Scroll al índice inicial después de que los datos se cargan y el FlatList se renderiza
          // Esto es un poco más robusto para initialScrollIndex
          if (flatListRef.current && result.data.allImages && result.data.allImages.length > 0 && validPrimaryIdx > 0) {
            setTimeout(() => { // Pequeño delay para asegurar que el FlatList esté listo
              flatListRef.current.scrollToIndex({ animated: false, index: validPrimaryIdx });
            }, 100);
          }

        } else {
          setError(result.message || "No se pudieron cargar los detalles.");
        }
      } catch (err) {
        setError("Ocurrió un error inesperado al cargar detalles.");
        console.error("Fetch Details Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (accommodationId && accommodationType) {
      fetchDetails();
    } else {
      setError("Información del alojamiento no proporcionada.");
      setIsLoading(false);
    }
  }, [accommodationId, accommodationType]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!accommodation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>No se encontró información para este alojamiento.</Text>
      </View>
    );
  }

  const renderImageCarouselItem = ({ item }) => (
    // Cada item del carrusel ahora tiene su propio contenedor para asegurar el ancho correcto
    <View style={styles.carouselImageContainer}>
      <Image
        source={{ uri: item.fullUrl }}
        style={styles.carouselImage}
        resizeMode="cover" // 'cover' para llenar, 'contain' para ver todo
        onError={(e) => console.warn(`Error cargando imagen carrusel: ${item.fullUrl}`, e.nativeEvent.error)}
      />
    </View>
  );

  return (
    <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
    >
      {/* Carrusel de Imágenes */}
      {accommodation.allImages && accommodation.allImages.length > 0 ? (
        <View style={styles.imageSection}>
          <FlatList
            ref={flatListRef} // Asignar la referencia
            data={accommodation.allImages}
            renderItem={renderImageCarouselItem}
            keyExtractor={(img, index) => (img.idRoomImage || img.idCabinImage || img.id || index).toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              // Asegurarse de que el índice no se salga de los límites
              const newIndex = Math.max(0, Math.min(index, accommodation.allImages.length - 1));
              setSelectedImageIndex(newIndex);
            }}
            getItemLayout={(data, index) => ({
              length: screenWidth, // Cada item ocupa el ancho de la pantalla
              offset: screenWidth * index,
              index,
            })}
            initialNumToRender={1}
            windowSize={Platform.OS === 'web' ? 5 : 3} // Cargar más imágenes en web
            maxToRenderPerBatch={Platform.OS === 'web' ? 3 : 1}
          />
          {accommodation.allImages.length > 1 && (
            <View style={styles.dotContainer}>
              {accommodation.allImages.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    index === selectedImageIndex ? styles.activeDot : {},
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.carouselImageContainer}>
            <Image
            source={{ uri: DEFAULT_PLACEHOLDER_IMAGE_DETAIL }}
            style={styles.carouselImage}
            resizeMode="contain"
            />
        </View>
      )}

      {/* Contenido de Detalles */}
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{accommodation.name || "Nombre no disponible"}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <FeatherIcon name="users" size={18} color="#55595c" style={styles.metaIcon} />
            <Text style={styles.metaText}>Capacidad: {accommodation.capacity || "N/A"} personas</Text>
          </View>
          {accommodation.price && (
            <View style={styles.metaItem}>
                <FeatherIcon name="dollar-sign" size={18} color="#007bff" style={styles.metaIcon} />
                <Text style={[styles.metaText, styles.priceText]}>
                    ${parseFloat(accommodation.price).toFixed(2)} / noche
                </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>
            {accommodation.description || "Sin descripción disponible."}
            </Text>
        </View>

        {accommodation.Comforts && accommodation.Comforts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comodidades</Text>
            <View style={styles.comfortsGrid}>
                {accommodation.Comforts.map((comfort) => (
                <View key={comfort.idComfort || comfort.id} style={styles.comfortChip}>
                    <FeatherIcon name="check-circle" size={18} color="#28a745" style={styles.comfortIcon} />
                    <Text style={styles.comfortText}>{comfort.name}</Text>
                </View>
                ))}
            </View>
          </View>
        )}
         {/* Si necesitas un botón de reserva, puedes añadirlo aquí */}
        {/* <TouchableOpacity
            style={styles.reserveButton}
            onPress={() => Alert.alert("Reserva", `Iniciar proceso de reserva para ${accommodation.name}`)}
        >
          <Text style={styles.reserveButtonText}>Reservar Ahora</Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Fondo blanco para un look más limpio
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#555',
  },
  infoText: {
      fontSize: 16,
      color: '#555',
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
  },
  imageSection: {
    // El fondo del carrusel puede ser el mismo que el de las imágenes si usan 'cover'
    // o un color oscuro si usan 'contain' y las imágenes tienen transparencia.
    backgroundColor: '#f0f0f0', // Un gris claro para el fondo del carrusel
  },
  carouselImageContainer: {
    width: screenWidth, // Cada imagen ocupa el ancho de la pantalla
    height: Platform.OS === 'web' ? 350 : 280, // Más alto en web
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef', // Placeholder si la imagen no carga o es 'contain'
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    position: 'absolute',
    bottom: 10, // Ligeramente más arriba
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.3)", // Puntos más oscuros para mejor contraste sobre imágenes claras
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#007bff",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 25, // Más espacio arriba
  },
  name: {
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: "bold",
    color: "#343a40", // Gris oscuro
    marginBottom: 10,
    lineHeight: Platform.OS === 'web' ? 36 : 30,
  },
  metaInfo: {
    flexDirection: "row",
    // justifyContent: "space-between", // Se manejará con flex en los items
    alignItems: "flex-start", // Alinea items arriba
    flexWrap: 'wrap', // Para que se ajusten si no caben en una línea
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef", // Borde más sutil
  },
  metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20, // Espacio entre items (capacidad y precio)
      marginBottom: 8, // Espacio si se van a la siguiente línea
  },
  metaIcon: {
      marginRight: 6,
  },
  metaText: {
    fontSize: 16,
    color: "#495057",
  },
  priceText: {
      fontWeight: 'bold',
      color: '#17a2b8' // Un azul verdoso para el precio
  },
  section: {
      marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e9ecef',
    // paddingBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#495057",
  },
  comfortsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5, // Pequeño espacio desde el título de sección
  },
  comfortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff', // Azul muy pálido (AliceBlue)
    borderWidth: 1,
    borderColor: '#cce7ff', // Borde azul claro
    borderRadius: 20, // Más redondeado para look de chip
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  comfortIcon: {
    marginRight: 8,
  },
  comfortText: {
    fontSize: 14,
    color: '#004085', // Azul oscuro para el texto del chip
  },

});

export default AccommodationDetailScreen;