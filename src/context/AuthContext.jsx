import {createContext, useContext, useEffect, useState} from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

import { resolveCurrentUser } from '@/firebase/functions';



const AuthContext = createContext({
    userDoc: {id: null, data: {}},
    role: null, 
    loading: true
});

// This code creates a React Authentication Context that makes a user's role available throughout the application
export function AuthProvider({ children }) {
    const [userDoc, setUserDoc] = useState({id: null, data: {}});
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();

        return auth.onAuthStateChanged(async (user) => {
            setLoading(true);
            setRole(null);
            setUserDoc({ id: null, data: {} });

            if (user && user.emailVerified){
                // set "userDoc" for modern console
                try {
                    const results = await resolveCurrentUser();
                    setUserDoc(results.data);
                } catch (error) {
                    console.error("Error Resolving the Current User: ", error);
                    setUserDoc({ id: null, data: {} });
                }

                // set "role" for legacy console
                try{
                    const snap = await getDoc(doc(db,"roles", user.email.toLowerCase()));
                    setRole(snap.exists() ? snap.data().role : "user");
                }
                catch(err){
                    console.log(err);
                    setRole("user");
                }
            }
            else{
                setRole(null);
            }

            setLoading(false);
        });
    }, []);
    return (
        <AuthContext.Provider value={{userDoc, role, loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useRole = () => useContext(AuthContext);