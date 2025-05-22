// src/services/accommodationService.js
import apiClient from './api'; // Usamos la instancia de axios configurada

const IMAGE_BASE_URL = 'http://localhost:3000/uploads/';

export const getAllAccommodations = async () => {
  try {
    // Hacemos ambas peticiones en paralelo
    const [cabinsResponse, bedroomsResponse] = await Promise.all([
      apiClient.get('/cabins'), // Endpoint para obtener todas las cabañas
      apiClient.get('/bedroom') // Endpoint para obtener todas las habitaciones
    ]);

    // Añadimos un campo 'type' para diferenciarlos fácilmente en el frontend
    const cabins = cabinsResponse.data.map(cabin => ({ ...cabin, type: 'cabin' }));
    const bedrooms = bedroomsResponse.data.map(bedroom => ({ ...bedroom, type: 'bedroom' }));

    // Combinamos y podrías ordenar o filtrar aquí si es necesario
    // Por ahora, solo combinamos. Podríamos querer priorizar un tipo o ordenar por nombre/precio.
    const allAccommodations = [...cabins, ...bedrooms];

    // Filtrar solo los que están en servicio (ej. 'available')
    const availableAccommodations = allAccommodations.filter(
      acc => acc.status && acc.status.toLowerCase() === 'en servicio'
    );

    console.log('Fetched and filtered accommodations:', availableAccommodations.length);
    return { success: true, data: availableAccommodations };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error al obtener los alojamientos";
    console.error('Get all accommodations error:', errorMessage, error.response?.data);
    return { success: false, message: errorMessage, data: [] };
  }
};

// Función para obtener la URL de la imagen principal de un alojamiento
export const getPrimaryImageUrl = (accommodation) => {
  if (!accommodation || !accommodation.images || accommodation.images.length === 0) {
    return null; // O una URL de imagen placeholder
  }

  let primaryImageObject = null;

  // 1. Buscar una imagen con el flag `isPrimary: true`
  primaryImageObject = accommodation.images.find(img => img.isPrimary === true);

  // 2. Si no se encontró con el flag, tomar la primera imagen del array como principal
  if (!primaryImageObject) {
    primaryImageObject = accommodation.images[0];
  } 

  if (primaryImageObject && primaryImageObject.imagePath) {
    const path = primaryImageObject.imagePath;

    // Verificar si el path ya es una URL completa (poco probable en tu caso)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Construir la URL completa
    const baseUrl = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL : IMAGE_BASE_URL + '/';
    const imagePathClean = path.startsWith('/') ? path.substring(1) : path;
    const finalUrl = `${baseUrl}${imagePathClean}`;

    return finalUrl;
  }

  return null; // O una URL de imagen placeholder
};

// Si necesitas obtener TODAS las imágenes para la pantalla de detalle:
export const getAccommodationImages = async (id, type) => {
  try {
    const endpoint = type === 'cabin'
      ? `/cabin-images/${id}` // Usando el IMAGE_API_URL de tu CabinService
      : `/room-images/${id}`;  // Usando el IMAGE_API_URL de tu bedroomService

    const response = await apiClient.get(endpoint);
    const imagesWithFullUrls = response.data.map(img => ({
      ...img,
      fullUrl: img.imagePath.startsWith('http') ? img.imagePath : `${IMAGE_BASE_URL}${img.imagePath.startsWith('/') ? img.imagePath.substring(1) : img.imagePath}`
    }));
    return { success: true, data: imagesWithFullUrls };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || `Error al obtener imágenes para ${type} ${id}`;
    console.error('Get accommodation images error:', errorMessage);
    return { success: false, message: errorMessage, data: [] };
  }
};
export const getAccommodationDetailsById = async (id, type) => {
  try {
    const dataEndpoint = type === 'cabin' ? `/cabins/${id}` : `/bedroom/${id}`; 
    
    // Petición para los datos del alojamiento
    const accommodationResponse = await apiClient.get(dataEndpoint);
    if (!accommodationResponse.data) {
        throw new Error("Alojamiento no encontrado");
    }
    const accommodationData = { ...accommodationResponse.data, type };

    // Petición para todas las imágenes de este alojamiento
    const imagesResult = await getAccommodationImages(id, type);
    if (imagesResult.success) {
      accommodationData.allImages = imagesResult.data; // Añadimos el array de imágenes con URLs completas
    } else {
      accommodationData.allImages = []; // Dejar vacío si falla la carga de imágenes
      console.warn(`No se pudieron cargar todas las imágenes para ${type} ${id}: ${imagesResult.message}`);
    }
    
   
    
    return { success: true, data: accommodationData };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || `Error al obtener detalles para ${type} ${id}`;
    console.error('Get accommodation details error:', errorMessage);
    return { success: false, message: errorMessage };
  }
};
