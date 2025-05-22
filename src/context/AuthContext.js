// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react"; // Asegúrate de tener useContext
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  logoutUser as performLogoutService,
  getStoredUser,
  refreshAuthToken,
  getUserProfile,
} from "../services/authMobileService";
import apiClient from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;
      // let storedUser = null; // No necesitas declararla aquí si solo se usa dentro del if

      try {
        const storedData = await getStoredUser();
        if (storedData && storedData.user && storedData.token) {
          userToken = storedData.token;
          // storedUser = storedData.user; // Solo necesario si lo usas directamente aquí
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${userToken}`;

          const profileResult = await getUserProfile();
          if (profileResult.success && profileResult.user) {
            setUser(profileResult.user);
            setToken(userToken);
            console.log(
              "User restored from storage & token validated:",
              profileResult.user
            );
          } else {
            console.warn(
              "Profile fetch failed with stored token, attempting refresh."
            );
            throw new Error("Token validation failed");
          }
        } else {
          console.log("No stored token or user found.");
          // Si no hay token, no necesitamos hacer más en el try, el finally se ejecutará.
          // Podrías incluso mover setIsLoading(false) aquí si no hay token.
          // Pero el flujo actual al catch y luego finally para el refresh está bien.
        }
      } catch (e) {
        console.warn(
          "Bootstrap: Initial token/profile check failed, attempting refresh. Error:",
          e.message
        );
        try {
          const refreshResult = await refreshAuthToken();
          if (refreshResult.success && refreshResult.token) {
            apiClient.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${refreshResult.token}`;
            const profileAfterRefresh = await getUserProfile();
            if (profileAfterRefresh.success && profileAfterRefresh.user) {
              setUser(profileAfterRefresh.user);
              setToken(refreshResult.token);
              await AsyncStorage.setItem(
                "user",
                JSON.stringify(profileAfterRefresh.user)
              );
              if (refreshResult.newRefreshToken) {
                await AsyncStorage.setItem(
                  "refreshToken",
                  refreshResult.newRefreshToken
                );
              }
              console.log(
                "User restored and token refreshed successfully:",
                profileAfterRefresh.user
              );
            } else {
              console.error(
                "Refresh successful but profile fetch failed. Logging out."
              );
              await performLogoutService();
              setUser(null);
              setToken(null);
            }
          } else {
            console.log(
              "Refresh token failed or not available. User remains logged out."
            );
            await performLogoutService();
            setUser(null);
            setToken(null);
          }
        } catch (refreshError) {
          console.error(
            "Bootstrap: Refresh attempt itself failed:",
            refreshError
          );
          await performLogoutService();
          setUser(null);
          setToken(null);
        } finally {
          setIsLoading(true)
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (userData, authToken, newRefreshToken) => {
    const profileResult = await getUserProfile()
    setUser(profileResult.user);
    setToken(authToken);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("authToken", authToken);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);
    console.log("AuthContext: User signed in and tokens stored");
  };

  const signOut = async () => {
    console.log("AuthContext: Signing out...");
    await performLogoutService();
    setUser(null);
    setToken(null);
    delete apiClient.defaults.headers.common["Authorization"];
    console.log(
      "AuthContext: User signed out, local state and AsyncStorage cleared."
    );
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut,setUser  }}>
      {children}
    </AuthContext.Provider>
  );
};

// ¡¡¡AÑADE ESTO!!!
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Es mejor verificar contra undefined porque null es un valor válido para el contexto inicial
    throw new Error("useAuth must be used within an AuthProvider");
  }
  if (context === null && !isLoading) {
    // Si el contexto es null y no está cargando, es un problema
    // Esta condición podría necesitar ajuste dependiendo de cómo manejes el estado inicial de `isLoading`
    // Pero la principal es que el context no sea undefined (no encontrado)
  }
  return context;
};
