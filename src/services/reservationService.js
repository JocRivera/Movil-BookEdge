import apiClient from "./api";

export const getAllReservations = async () => {
    try {
        const response = await apiClient.get('/reservations');
        return { success: true, data: response.data };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error al obtener las reservas';
        console.error('Get all reservations error:', errorMessage);
        return { success: false, message: errorMessage, data: [] };
    }
    }