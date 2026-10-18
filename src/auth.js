import { createContext, useContext } from 'react';

// The signed-in Firebase user, provided by the navigator to every app screen.
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);
