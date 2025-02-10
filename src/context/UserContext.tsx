// src/contexts/UserContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { addUser, getAllUsers, getLoggedUser, setUserLogged, getUserById, logoutUser } from '../services/AsyncStorageService';

interface UserContextType {
  user: User | null;
  setUser: (user: User) => Promise<void>;
  loadUser: () => Promise<void>;
  registerGuest: () => Promise<void>;
  loginUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);

  // Al primo avvio dell'app, cerchiamo l'utente loggato
  useEffect(() => {
    const loadInitialUser = async () => {
      console.log("Inizio del caricamento dell'utente loggato...");
      try {
        const existingUser = await getLoggedUser();
        if (existingUser) {
          console.log('Trovato utente loggato:', existingUser);
          setUserState(existingUser);
        } else {
          console.log('Nessun utente loggato trovato. Creazione utente guest...');
          await registerGuest();  // Crea e salva in AsyncStorage
        }
      } catch (error) {
        console.error("Errore nel caricamento dell'utente loggato:", error);
        console.log('Registro un utente guest a causa di un errore.');
        await registerGuest();
      }
    };

    loadInitialUser();
  }, []);

  // Impostare un nuovo utente e salvarlo su AsyncStorage
  const setUser = useCallback(async (newUser: User) => {
    await addUser(newUser);
    await setUserLogged(newUser._id);
    setUserState(newUser);
  }, []);

  // Caricare l'utente salvato (se vuoi un metodo ad-hoc da richiamare in giro)
  const loadUser = useCallback(async () => {
    const existingUser = await getLoggedUser();
    if (existingUser) {
      setUserState(existingUser);
    }
  }, []);

  // Registra un utente ospite e salvalo su AsyncStorage
  const registerGuest = useCallback(async () => {
    const guestUser: User = {
      _id: `user_${Date.now()}`, // Genera un ID unico, ad esempio con timestamp
      name: 'Ospite',
      email: '',
      age: 0,
      weight: 0,
      height: 0,
      isRegistered: false,
      isLogged: true, // <--- lo settiamo loggato
    };
    // Salva in AsyncStorage
    await addUser(guestUser);
    await setUserLogged(guestUser._id);
    // Imposta in stato
    setUserState(guestUser);
  }, []);

  // Funzione per loggare un utente specifico
  const loginUser = useCallback(async (userId: string) => {
    await setUserLogged(userId);
    const loggedUser = await getUserById(userId);
    if (loggedUser) {
      setUserState(loggedUser);
    } else {
      console.error(`Utente con ID ${userId} non trovato durante il login.`);
    }
  }, []);

  // Funzione per logout
  const logout = useCallback(async () => {
    if (user) {
      await logoutUser(user._id);
      setUserState(null);
      // Potresti voler navigare l'utente alla schermata di login o simili
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loadUser,
        registerGuest,
        loginUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
