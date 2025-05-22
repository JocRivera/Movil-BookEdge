import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configura esta URL base para que apunte a tu backend.
// Si tu backend corre en localhost:3000 en tu PC:

// Para Emulador Android:
// const API_URL = 'http://10.0.2.2:3000/'; // Si tu API tiene una ruta base como /api

// Para Simulador iOS (o si pruebas en web con 'expo start --web'):
const API_URL = 'http://localhost:3000';

// Para Dispositivo Físico (reemplaza con la IP de tu PC en la red WiFi):
// const API_URL = 'http://TU_IP_LOCAL_PC:3000/';

// Si tu API no tiene una ruta base "/api" y las rutas empiezan directamente
// desde el puerto 3000 (ej. http://localhost:3000/auth/login), entonces quita /api:
// const API_URL = 'http://10.0.2.2:3000'; // Para Emulador Android SIN /api base
// const API_URL = 'http://localhost:3000'; // Para Simulador iOS SIN /api base

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    console.log(`Interceptor: Token from AsyncStorage for URL ${config.url}:`, token ? 'Token Present' : 'No Token'); // O imprime el token si no es muy largo
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Interceptor: Attaching token to ${config.url}`);
    } else {
      console.log(`Interceptor: No token to attach for ${config.url}`);
    }
    return config;
  },
  // ...
);
// OPCIONAL: Interceptor para manejar el refresh token automáticamente (más avanzado)
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && originalRequest.url !== `${API_URL}/auth/refresh` && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = await AsyncStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           // No hay refresh token, desloguear o redirigir a login
//           // Aquí podrías llamar a una función de logout del AuthContext si lo tienes disponible
//           // o emitir un evento para que la UI reaccione.
//           console.log("No refresh token, redirecting to login or logging out");
//           await AsyncStorage.removeItem('authToken');
//           await AsyncStorage.removeItem('user');
//           // Aquí se necesitaría una forma de navegar al login si no se usa context directamente
//           return Promise.reject(error);
//         }

//         // Usar axios.post directamente para evitar bucle infinito de interceptores
//         const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

//         await AsyncStorage.setItem('authToken', data.token);
//         if (data.refreshToken) { // Si tu backend devuelve un nuevo refresh token (rotación)
//             await AsyncStorage.setItem('refreshToken', data.refreshToken);
//         }

//         apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
//         originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error("Refresh token failed or session expired:", refreshError);
//         // El refresh token falló, limpiar todo y desloguear
//         await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
//         // Aquí también necesitarías una forma de navegar al login.
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default apiClient;