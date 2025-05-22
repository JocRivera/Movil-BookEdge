// src/screens/UserProfileScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { updateProfile as updateProfileServiceFunction } from "../services/authMobileService";
import FeatherIcon from "react-native-vector-icons/Feather";
import Toast from 'react-native-toast-message'; // Descomenta cuando lo instales y configures

const initialFormDataState = (currentUser) => ({
  name: currentUser?.name || "",
  eps: currentUser?.eps || "",
  identificationType: currentUser?.identificationType || "CC",
  identification: currentUser?.identification || "",
  cellphone: currentUser?.cellphone || "",
  address: currentUser?.address || "",
  birthdate: currentUser?.birthdate ? currentUser.birthdate.split("T")[0] : "",
});

const UserProfileScreen = ({ navigation }) => {
  const {
    user,
    setUser,
    signOut,
    isLoading: isAuthContextLoading,
  } = useContext(AuthContext); // Obtener setUser y isLoading del contexto
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormDataState(user || {})); // Inicializar con user o un objeto vacío
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el loader del botón de guardar

  useEffect(() => {
    if (user) {
      setFormData(initialFormDataState(user));
      navigation.setOptions({ title: user.name || "Mi Perfil" });
    } else {
      setFormData(initialFormDataState({})); // Resetear si no hay usuario
      navigation.setOptions({ title: "Mi Perfil" });
    }
  }, [user, navigation]);

  const validateField = (name, value) => {
    let error = "";
    if (
      !value &&
      (name === "name" ||
        name === "identification" ||
        name === "cellphone" ||
        name === "identificationType")
    ) {
      error = "Este campo es requerido.";
    } else if (name === "name" && value.trim().length < 3) {
      error = "Debe tener al menos 3 caracteres.";
    } else if (name === "identification" && value.trim().length < 5) {
      error = "Debe tener al menos 5 caracteres.";
    } else if (
      name === "cellphone" &&
      value &&
      !/^\d{10}$/.test(value.trim())
    ) {
      error = "Debe ser un número de 10 dígitos.";
    } else if (name === "birthdate" && value) {
      const today = new Date();
      const birthDate = new Date(value);
      if (isNaN(birthDate.getTime())) {
        error = "Fecha de nacimiento inválida.";
      } else {
        today.setHours(0, 0, 0, 0);
        birthDate.setHours(0, 0, 0, 0);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (birthDate > today) error = "La fecha no puede ser futura.";
        else if (age < 18) error = "Debes ser mayor de 18 años.";
      }
    }
    return error;
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (name) => {
    const errorMsg = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    const fieldsToValidate = [
      { name: "name", required: true },
      { name: "identificationType", required: true },
      { name: "identification", required: true },
      { name: "cellphone", required: true },
      { name: "birthdate", required: false },
    ];

    fieldsToValidate.forEach((field) => {
      const value = formData[field.name];
      const error = validateField(field.name, value);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      } else if (field.required && (!value || String(value).trim() === "")) {
        newErrors[field.name] = "Este campo es requerido.";
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Error de Validación",
        "Por favor, corrige los campos marcados."
      );
      // Toast.show({ type: 'error', text1: 'Error de Validación', text2: 'Por favor, corrige los campos marcados.', position: 'bottom' });
      return;
    }
    setIsSubmitting(true);

    const { ...payloadToSend } = formData;

    const result = await updateProfileServiceFunction(
      user.idUser,
      payloadToSend
    );

    setIsSubmitting(false);
    if (result.success && result.data) {
      // Es crucial que setUser actualice el 'user' en AuthContext.
      // Y que result.data sea el objeto usuario completo y actualizado del backend.
      setUser((prevUser) => ({ ...prevUser, ...result.data }));
      setIsEditing(false);
      setErrors({});
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      // Toast.show({ type: 'success', text1: '¡Éxito!', text2: 'Perfil actualizado correctamente.', position: 'bottom' });
    } else {
      let errorMessage = result.message || "Error al actualizar el perfil.";
      const backendFieldErrors = {};
      if (result.errors && Array.isArray(result.errors)) {
        let specificErrorMessages = [];
        result.errors.forEach((err) => {
          if (err.path && typeof err.path === "string")
            backendFieldErrors[err.path] = err.msg;
          specificErrorMessages.push(err.msg);
        });
        if (specificErrorMessages.length > 0) {
          errorMessage =
            specificErrorMessages.filter(Boolean).join("\n") ||
            "Error desconocido desde el backend.";
        }
        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }
      Alert.alert("Error al Actualizar", errorMessage);
      // Toast.show({ type: 'error', text1: 'Error al Actualizar', text2: errorMessage, position: 'bottom' });
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setErrors({});
    if (user) {
      setFormData(initialFormDataState(user));
    }
  };

  // Mostrar loader si AuthContext está cargando o si el usuario aún no está disponible
  if (isAuthContextLoading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Para el Picker, necesitarás instalar @react-native-picker/picker y usarlo aquí.
  // Esta es una representación de solo texto por ahora.
  const renderPickerField = (label, name, selectedValue, items) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
        {isEditing && errors[name] ? (
          <Text style={styles.requiredAsterisk}> *</Text>
        ) : (
          ""
        )}
      </Text>
      {isEditing ? (
        <TouchableOpacity
          style={[
            styles.pickerContainer,
            errors[name] ? styles.inputError : {},
          ]}
          onPress={() =>
            Alert.alert(
              "Seleccionar Tipo ID",
              "Implementar Picker aquí para cambiar entre CC y CE"
            )
          } // Placeholder para la acción del picker
        >
          <Text style={styles.pickerTextDisplay}>
            {items.find((opt) => opt.value === selectedValue)?.label ||
              "Seleccionar..."}
          </Text>
          <FeatherIcon
            name="chevron-down"
            size={20}
            color="#495057"
            style={styles.pickerIcon}
          />
        </TouchableOpacity>
      ) : (
        <Text style={styles.valueText}>
          {items.find((opt) => opt.value === selectedValue)?.label ||
            "No especificado"}
        </Text>
      )}
      {isEditing && errors[name] && (
        <Text style={styles.errorTextValidation}>{errors[name]}</Text>
      )}
    </View>
  );

  const renderTextField = (
    label,
    name,
    placeholder,
    keyboardType = "default",
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
        {isEditing &&
        (errors[name] ||
          (!formData[name] &&
            ["name", "identification", "cellphone"].includes(name))) ? (
          <Text style={styles.requiredAsterisk}> *</Text>
        ) : (
          ""
        )}
      </Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, errors[name] ? styles.inputError : {}]}
          value={String(formData[name] || "")}
          onChangeText={(text) => handleChange(name, text)}
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          placeholderTextColor="#a0a0a0"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={
            multiline ? (Platform.OS === "ios" ? undefined : 3) : 1
          }
          textAlignVertical={multiline ? "top" : undefined}
        />
      ) : (
        <Text style={styles.valueText}>
          {String(formData[name] || "No especificado")}
        </Text>
      )}
      {isEditing && errors[name] && (
        <Text style={styles.errorTextValidation}>{errors[name]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <FeatherIcon name="user" size={40} color="#fff" />
              )}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name || "Usuario"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>
              {user.role.name || "Rol no definido"}
            </Text>
          {/* {user.role && (
            <Text style={styles.userRole}>
              {user.role?.name || "Rol no definido"}
            </Text>
          )} */}
        </View>

        <View style={styles.formContainer}>
          {renderTextField("Nombre Completo", "name", "Tu nombre completo")}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.valueTextDisabled}>
              {user.email} (No editable)
            </Text>
          </View>
          {renderPickerField(
            "Tipo de Identificación",
            "identificationType",
            formData.identificationType,
            [
              { label: "Cédula de Ciudadanía", value: "CC" },
              { label: "Cédula de Extranjería", value: "CE" },
            ]
          )}
          {renderTextField(
            "Número de Identificación",
            "identification",
            "Tu número de ID",
            "numeric"
          )}
          {renderTextField(
            "Teléfono/Celular",
            "cellphone",
            "Tu número de celular",
            "phone-pad"
          )}
          {renderTextField(
            "Fecha de Nacimiento",
            "birthdate",
            "AAAA-MM-DD",
            "default"
          )}
          {renderTextField(
            "Dirección de Residencia",
            "address",
            "Tu dirección"
          )}
          {renderTextField("EPS", "eps", "Tu EPS")}

          {isEditing && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <FeatherIcon name="save" size={20} color="#fff" />
                )}
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEditing}
                disabled={isSubmitting}
              >
                <FeatherIcon name="x" size={20} color="#343a40" />
                <Text style={[styles.buttonText, { color: "#343a40" }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isEditing && (
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => {
              setIsEditing(true);
              setErrors({});
            }}
          >
            <FeatherIcon name="edit-2" size={20} color="#fff" />
            <Text style={styles.buttonText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={signOut}
          disabled={isSubmitting}
        >
          <FeatherIcon name="log-out" size={20} color="#fff" />
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Padding para el contenido centrado
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  profileHeader: {
    backgroundColor: "#007bff",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    // Sombra para el header
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3, // Borde más grueso
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 15,
    color: "#e9ecef", // Un blanco más suave
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007bff", // Azul para el texto del rol
    backgroundColor: "#fff", // Fondo blanco para el badge del rol
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 22, // Un poco más de espacio
  },
  label: {
    fontSize: 15,
    fontWeight: "600", // Un poco más de peso
    color: "#495057", // Gris oscuro
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: "#dc3545",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    fontSize: 16,
    color: "#495057",
    minHeight: Platform.OS === "ios" ? 50 : undefined,
  },
  inputError: {
    borderColor: "#e74c3c", // Un rojo más estándar para errores
    backgroundColor: "#fff6f6",
  },
  valueText: {
    fontSize: 16,
    color: "#343a40",
    paddingVertical: 12, // Espaciado similar al input
    // Para un look más de "campo lleno pero no editable":
    // backgroundColor: '#f8f9fa',
    // paddingHorizontal: 15,
    // borderRadius: 8,
    // borderWidth: 1,
    // borderColor: '#e9ecef',
    // minHeight: Platform.OS === 'ios' ? 50 : undefined,
  },
  valueTextDisabled: {
    fontSize: 16,
    color: "#6c757d",
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    paddingHorizontal: 15,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    minHeight: Platform.OS === "ios" ? 50 : undefined,
  },
  pickerContainer: {
    flexDirection: "row", // Para alinear texto e icono
    alignItems: "center", // Centrar verticalmente
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingLeft: 15, // Padding izquierdo para el texto
    paddingRight: 10, // Padding derecho para el icono
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    backgroundColor: "#fff",
    justifyContent: "space-between", // Separar texto e icono
    minHeight: Platform.OS === "ios" ? 50 : undefined,
  },
  pickerTextDisplay: {
    fontSize: 16,
    color: "#495057",
    flex: 1, // Para que ocupe el espacio y el icono se vaya a la derecha
  },
  pickerIcon: {
    // No es necesario mucho estilo aquí si el contenedor maneja el layout
  },
  errorTextValidation: {
    color: "#dc3545",
    fontSize: 13,
    marginTop: 5, // Un poco más de espacio
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25, // Más espacio
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 25,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14, // Botones un poco más altos
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Sombra más pronunciada
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Elevación para Android
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold", // Más bold
    marginLeft: 10, // Más espacio para el icono
  },
  editButton: {
    backgroundColor: "#007bff",
    alignSelf: "center",
    marginVertical: 25,
  },
  saveButton: {
    backgroundColor: "#28a745",
    flex: 1,
    marginRight: 8, // Un poco más de espacio
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderColor: "#adb5bd", // Borde un poco más oscuro
    borderWidth: 1,
    flex: 1,
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    marginTop: 35,
    marginBottom: 25,
    marginHorizontal: 20,
  },
});

export default UserProfileScreen;
