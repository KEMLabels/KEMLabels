import React, {useState, useEffect} from 'react'
import axios from "../api/axios"

export const AuthContext = React.createContext();

function AuthProvider({children}) {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn'));
    useEffect(() => {
        axios
          .get("/getSessionInfo", { withCredentials: true })
          .then((res) => {
            res.data.isLoggedIn ? setIsLoggedIn(true) : setIsLoggedIn(false);
          })
          .catch((err) => console.log(err));
      }, []);
  return (
    <AuthContext.Provider value={{isLoggedIn, setIsLoggedIn}}>
        {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider