import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    // Tu backend devuelve: { message, user, token, refreshToken }
    const { token, refreshToken, user } = response.data;

    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return { success: true, user, token, refreshToken };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error en el inicio de sesión";
    console.error('Login error:', errorMessage, error.response?.data);
    return { success: false, message: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    // Opcional: llamar al endpoint de logout de tu backend si invalida el refresh token en BD
    // No es estrictamente necesario si el interceptor de refresh maneja bien los tokens inválidos.
    // const authToken = await AsyncStorage.getItem('authToken');
    // if (authToken) { // Solo si hay un token, para evitar errores si se llama sin estar logueado
    //    await apiClient.post('/auth/logout'); // Asume que el interceptor añade el token
    // }
    // console.log("Called backend logout (optional)");

    // Siempre limpiar tokens locales
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    console.log("Tokens cleared from AsyncStorage");
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error al cerrar sesión";
    console.error('Logout error:', errorMessage);
    // Incluso si falla la llamada al backend (si la haces), limpia los tokens locales.
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    return { success: false, message: errorMessage };
  }
};

export const getStoredUser = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    const authToken = await AsyncStorage.getItem('authToken');
    if (userString && authToken) {
      return { user: JSON.parse(userString), token: authToken };
    }
    return null;
  } catch (error) {
    console.error("Error getting stored user:", error);
    return null;
  }
};

export const refreshAuthToken = async () => {
  try {
    const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      throw new Error("No refresh token available");
    }
    // Tu endpoint de refresh espera el refreshToken en el body
    // Usamos apiClient directamente aquí, ya que el interceptor de respuesta no debería
    // intentar refrescar un token si esta llamada específica de refresh falla.
    const response = await apiClient.post('/auth/refresh', { refreshToken: currentRefreshToken });
    const { token, refreshToken: newRefreshTokenIfRotated } = response.data;

    await AsyncStorage.setItem('authToken', token);
    if (newRefreshTokenIfRotated) { // Si tu backend rota y devuelve un nuevo refresh token
      await AsyncStorage.setItem('refreshToken', newRefreshTokenIfRotated);
    }
    console.log("Token refreshed successfully by authMobileService");
    return { success: true, token, newRefreshToken: newRefreshTokenIfRotated };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error al refrescar el token";
    console.error('Refresh token error in authMobileService:', errorMessage);
    // Si el refresh token falla, probablemente debamos desloguear (handled by AuthContext or interceptor)
    // await logoutUser(); // Podrías llamarlo aquí, pero AuthContext lo manejará
    return { success: false, message: errorMessage };
  }
};

export const getUserProfile = async () => {
  try {
    // El interceptor de apiClient ya debería añadir el token
    const response = await apiClient.get('/auth/me');
    return { success: true, user: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error al obtener el perfil";
    console.error('Get profile error:', errorMessage, error.response?.data);
    return { success: false, message: errorMessage };
  }
};

export const updateProfile = async (userId, data) => { // <--- DEBE TENER 'export'
  try {
    const response = await apiClient.put(`/auth/update/${userId}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error al actualizar perfil (servicio móvil):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Error desconocido al actualizar.",
      errors: error.response?.data?.errors,
    };
  }
};