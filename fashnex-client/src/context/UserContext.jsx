import React, { useEffect, useContext, useState, createContext } from "react";
import { AuthDataContext } from "./authContext";
import axios from "axios";

export const UserDataContext = createContext();

function UserContext({ children }) {

    const [userData, setUserData] = useState(null);
    const { serverUrl } = useContext(AuthDataContext);

    const getCurrentUser = async () => {
        try {
            const result = await axios.post(
                serverUrl + "/api/user/getCurrentUser",{},
                { withCredentials: true }
            );
            setUserData(result.data);
            return result.data;
        }
        catch (error) {
            setUserData(null);
            return null;
        }
    };

    useEffect(() => {
        getCurrentUser();
    }, []);

    const value = {
        userData,
        setUserData,
        getCurrentUser
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
}

export default UserContext;