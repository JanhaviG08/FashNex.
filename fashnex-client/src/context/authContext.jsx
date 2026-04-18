import React from 'react'
import { createContext } from 'react'
export const AuthDataContext = createContext();


function authContext({children}) {
    let serverUrl = "http://localhost:8000"

    let value = {
        serverUrl
    }
    
  return (
    <div>
        <AuthDataContext.Provider value={value}>
            {children}
        </AuthDataContext.Provider>
    </div>
  )
}

export default authContext;