// src/screens/AlojamientosScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { getAllAccommodations, getPrimaryImageUrl } from '../services/accommodationService';
// import FeatherIcon from 'react-native-vector-icons/Feather';

const DEFAULT_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200.png?text=No+Imagen';

// Mapeo de estilos para los badges de estado
const statusStylesConfig = {
  'En Servicio': { backgroundColor: '#28a745', textColor: '#fff' }, // Verde
  'Mantenimiento': { backgroundColor: '#ffc107', textColor: '#333' }, // Amarillo
  'Fuera de Servicio': { backgroundColor: '#dc3545', textColor: '#fff' }, // Rojo (o el nombre exacto que uses)
  'default': { backgroundColor: 'rgba(0,0,0,0.4)', textColor: '#fff' } // Color por defecto
};

const AccommodationCard = ({ item, onPress }) => {
  const imageUrl = getPrimaryImageUrl(item) || DEFAULT_PLACEHOLDER_IMAGE;
  // Obtener el estilo del estado, o el por defecto si el estado no se encuentra
  const currentStatusStyle = statusStylesConfig[item.status] || statusStylesConfig.default;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        onError={(errorEvent) => console.warn(`Error al cargar imagen para ${item.name || item.cabinName}: ${imageUrl}`, errorEvent.nativeEvent.error)}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.name || item.cabinName || 'Alojamiento sin nombre'}</Text>
        <View style={styles.cardDetailsRow}>
          {/* <FeatherIcon name="users" size={14} color="#555" /> */}
         <Text style= {styles.capacidadcard}>Capacidad: <Text style={styles.cardDetailText}> {item.capacity || 'N/A'} Personas</Text></Text>
        </View>
        {item.price && (
            <Text style={styles.cardPrice}>
                ${parseFloat(item.price).toFixed(2)} / noche
            </Text>
        )}
      </View>
      {item.status && (
        <View style={[styles.statusBadge, { backgroundColor: currentStatusStyle.backgroundColor }]}>
          <Text style={[styles.statusBadgeText, { color: currentStatusStyle.textColor }]}>
            {item.status === 'En Servicio' ? 'Disponible' : item.status}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const AlojamientosScreen = ({ navigation }) => {
  const [accommodations, setAccommodations] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'cabin', 'bedroom'

  const fetchAccommodations = async () => {
    setError(null);
    const result = await getAllAccommodations();
    if (result.success) {
      setAccommodations(result.data);
      // applyFilters se llamará desde el useEffect cuando accommodations cambie
    } else {
      setError(result.message);
      setAccommodations([]);
      setFilteredAccommodations([]);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAccommodations().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccommodations(); // fetchAccommodations ya no llama a setIsLoading
    setRefreshing(false);
  }, []); // Dependencia vacía si fetchAccommodations no depende de nada externo que cambie

  const applyFilters = useCallback((dataToFilter, currentSearchTerm, currentFilterType) => {
    let result = dataToFilter;
    if (currentFilterType !== 'all') {
      result = result.filter(item => item.type === currentFilterType);
    }
    if (currentSearchTerm) {
      result = result.filter(item =>
        (item.name || item.cabinName || '').toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }
    setFilteredAccommodations(result);
  }, []);


  useEffect(() => {
    applyFilters(accommodations, searchTerm, filterType);
  }, [searchTerm, filterType, accommodations, applyFilters]);


   const handleCardPress = (item) => {
    // Asegúrate de que 'id' y 'type' existan en el objeto 'item'
    // Si tus IDs se llaman idCabin o idRoom, necesitas pasarlos correctamente.
    const itemId = item.idCabin || item.idRoom || item.id; // Prioriza idCabin/idRoom
    if (!itemId) {
        console.error("Error: El item no tiene un ID válido para la navegación.", item);
        Alert.alert("Error", "No se pudo obtener el ID del alojamiento.");
        return;
    }
    if (!item.type) {
        console.error("Error: El item no tiene un tipo válido para la navegación.", item);
        Alert.alert("Error", "No se pudo obtener el tipo del alojamiento.");
        return;
    }

    console.log('Navegando a detalle de:', item.name || item.cabinName, 'ID:', itemId, 'Tipo:', item.type);
    navigation.navigate('AccommodationDetail', {
      accommodationId: itemId,
      accommodationType: item.type,
      accommodationName: item.name || item.cabinName
    });
  };

  if (isLoading && accommodations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Cargando alojamientos...</Text>
      </View>
    );
  }

  if (error && accommodations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => { setIsLoading(true); fetchAccommodations().finally(() => setIsLoading(false));}} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#888"
        />
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
            onPress={() => setFilterType('all')}>
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterButtonText]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'cabin' && styles.activeFilterButton]}
            onPress={() => setFilterType('cabin')}>
            <Text style={[styles.filterButtonText, filterType === 'cabin' && styles.activeFilterButtonText]}>Cabañas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'bedroom' && styles.activeFilterButton]}
            onPress={() => setFilterType('bedroom')}>
            <Text style={[styles.filterButtonText, filterType === 'bedroom' && styles.activeFilterButtonText]}>Habitaciones</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredAccommodations.length === 0 && !isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No se encontraron alojamientos que coincidan.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAccommodations}
          renderItem={({ item }) => <AccommodationCard item={item} onPress={handleCardPress} />}
          keyExtractor={(item) => `${item.type}-${item.idCabin || item.idRoom || item.id}`} // Usa idCabin/idRoom
          contentContainerStyle={styles.listContentContainer}
          numColumns={Platform.OS === 'web' ? 2 : 1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
      backgroundColor: '#007bff',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
  },
  retryButtonText: {
      color: '#fff',
      fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    textAlign: 'center',
  },
  filterContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#007bff',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  listContentContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 15 : 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: Platform.OS === 'web' ? 8 : 0,
    marginBottom: 15,
    flex: Platform.OS === 'web' ? 1 : undefined,
    maxWidth: Platform.OS === 'web' ? '48%' : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardDetailsRow: { // Para alinear icono y texto si los usas
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  cardDetailText: {
    // marginLeft: 5, // Solo si usas icono
    fontSize: 14,
    color: '#555',
  },
  capacidadcard:{
    fontSize:15,
    color:'#023047',
    fontStyle:'bold',
    fontWeight:700

},
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 5, // Ajustado
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default AlojamientosScreen;