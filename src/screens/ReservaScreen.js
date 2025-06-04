// src/screens/ReservasScreen.js
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    Platform,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { getAllReservations } from '../services/reservationService'; // Servicio que necesitarás crear

// Configuración de colores y estilos por status de reserva
const reservationStatusConfig = {
    'reservado': {
        borderColor: '#ffc107',
        backgroundColor: '#fff8e1',
        iconName: 'clock',
        iconColor: '#ff8f00'
    },
    'confirmado': {
        borderColor: '#28a745',
        backgroundColor: '#e8f5e8',
        iconName: 'check-circle',
        iconColor: '#28a745'
    },
    'cancelada': {
        borderColor: '#dc3545',
        backgroundColor: '#fdeaea',
        iconName: 'x-circle',
        iconColor: '#dc3545'
    },
    'pendiente': {
        borderColor: '#007bff',
        backgroundColor: '#e3f2fd',
        iconName: 'play-circle',
        iconColor: '#007bff'
    },
    'anulado': {
        borderColor: '#6c757d',
        backgroundColor: '#f8f9fa',
        iconName: 'slash',
        iconColor: '#6c757d'
    }
};


const ReservationCard = ({ item, onPress }) => {
    const statusConfig = reservationStatusConfig[item.status.toLowerCase()] || reservationStatusConfig['reservado'];

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1, Number(day)); // mes es 0-indexado
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };


    return (
        <TouchableOpacity
            style={[
                styles.reservationCard,
                {
                    borderLeftColor: statusConfig.borderColor,
                    backgroundColor: statusConfig.backgroundColor
                }
            ]}
            onPress={() => onPress(item)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.statusIndicator}>
                    <FeatherIcon
                        name={statusConfig.iconName}
                        size={18}
                        color={statusConfig.iconColor}
                    />
                    <Text style={[styles.statusText, { color: statusConfig.iconColor }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
                <Text style={styles.reservationNumber}>#{item.idReservation}</Text>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.mainInfo}>
                    <Text style={styles.clientName}>{item.user.identification}</Text>
                    <Text style={styles.accommodationName}>
                        {[
                            ...(item.cabins?.map(cabin => cabin.name || cabin.cabinName) || []),
                            ...(item.bedrooms?.map(room => room.name || room.bedroomName) || [])
                        ].join(', ') || 'Sin alojamiento'}
                    </Text>
                </View>

                <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                        <FeatherIcon name="calendar" size={14} color="#666" />
                        <Text style={styles.detailLabel}>Check-in:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.startDate)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FeatherIcon name="calendar" size={14} color="#666" />
                        <Text style={styles.detailLabel}>Check-out:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FeatherIcon name="package" size={14} color="#666" />
                        <Text style={styles.detailLabel}>Plan:</Text>
                        <Text style={styles.detailValue}>{item.plan.name}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const SectionHeader = ({ title, count, isExpanded, onToggle }) => {
    return (
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
            <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionHeaderRight}>
                    <Text style={styles.sectionCount}>({count})</Text>
                    <FeatherIcon
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const ReservasScreen = ({ navigation }) => {
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        'reservado': true,
        'confirmado': true,
        'pendiente': true,
        'cancelada': false,
        'anulado': false
    });

    const fetchReservations = async () => {
        setError(null);
        try {
            const result = await getAllReservations();
            if (result.success) {
                console.log('Fetched Reservations:', result.data);
                setReservations(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error al cargar las reservas');
            console.error('Fetch Reservations Error:', err);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchReservations().finally(() => setIsLoading(false));
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReservations();
        setRefreshing(false);
    }, []);

    const toggleSection = (sectionKey) => {
        if (Platform.OS === 'ios') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const handleCardPress = (item) => {
        // Navegar a los detalles de la reserva
        console.log('Navegando a detalle de reserva:', item.idReservation);
        // navigation.navigate('ReservationDetail', { reservationId: item.idReservation });
        Alert.alert('Detalle de Reserva', `Ver detalles de la reserva ${item.numeroReserva}`);
    };

    const filterReservations = (reservations, searchTerm) => {
        if (!searchTerm) return reservations;

        return reservations.filter(reservation =>
            reservation?.user?.identification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation?.alojamiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.idReservation.toString().includes(searchTerm)
        );
    };

    const groupReservationsByStatus = (reservations) => {
        const filtered = filterReservations(reservations, searchTerm);
        const grouped = {};

        // Inicializar todos los statuss
        Object.keys(reservationStatusConfig).forEach(status => {
            grouped[status] = [];
        });

        // Agrupar reservas por status
        filtered.forEach(reservation => {
            const status = reservation.status.toLowerCase();
            if (grouped[status]) {
                grouped[status].push(reservation);
            }
        });

        // Convertir a formato de secciones para SectionList
        return Object.keys(grouped)
            .filter(status => grouped[status].length > 0 || expandedSections[status])
            .map(status => ({
                title: status.charAt(0).toUpperCase() + status.slice(1),
                key: status,
                data: expandedSections[status] ? grouped[status] : [],
                count: grouped[status].length
            }));
    };

    if (isLoading && reservations.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Cargando reservas...</Text>
            </View>
        );
    }

    if (error && reservations.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setIsLoading(true);
                        fetchReservations().finally(() => setIsLoading(false));
                    }}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sections = groupReservationsByStatus(reservations);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <FeatherIcon name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por cliente, alojamiento o número..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#888"
                    />
                    {searchTerm ? (
                        <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
                            <FeatherIcon name="x" size={20} color="#666" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <SectionList
                sections={sections}
                renderItem={({ item }) => (
                    <ReservationCard item={item} onPress={handleCardPress} />
                )}
                renderSectionHeader={({ section }) => (
                    <SectionHeader
                        title={section.title}
                        count={section.count}
                        isExpanded={expandedSections[section.key]}
                        onToggle={() => toggleSection(section.key)}
                    />
                )}
                keyExtractor={(item) => `reservation-${item.idReservation}`}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#007bff"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <FeatherIcon name="calendar" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>No se encontraron reservas</Text>
                    </View>
                }
            />
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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: '#dc3545',
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
        marginTop: 10,
        textAlign: 'center',
    },
    searchContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 45,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 5,
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    sectionHeader: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: 10,
    },
    sectionHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionCount: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    reservationCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 8,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    reservationNumber: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    cardContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    mainInfo: {
        marginBottom: 12,
    },
    clientName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#023047',
        marginBottom: 4,
    },
    accommodationName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    detailsSection: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        marginRight: 8,
        minWidth: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
});

export default ReservasScreen;