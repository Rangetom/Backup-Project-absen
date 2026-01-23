'use client';

import { createContext, useState, useEffect, useContext } from "react";
import axios from "../utils/axios";
import { useRouter } from "next/navigation";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔐 LOAD USER DENGAN TOKEN
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("auth_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 🔑 LOGIN
  const login = async (form) => {
    const response = await axios.post("/login", form);

    localStorage.setItem("auth_token", response.data.token);
    setUser(response.data.user);

    if (response.data.user.role === "admin") {
      router.push("/dashboard");
    } else if (response.data.user.role === "magang" || response.data.user.role === "karyawan") {
      router.push("/home");
    } else {
      router.push("/home");
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    const token = localStorage.getItem("auth_token");

    try {
      if (token) {
        await axios.post(
          "/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      router.push("/");
    }
  };

  // 📌 ATTENDANCE SETTING (INI YANG KAMU BUTUH)
  const getAttendanceSetting = async () => {
    const token = localStorage.getItem("auth_token");

    const response = await axios.get("/attendance-setting", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  };

  const updateAttendanceSetting = async (data) => {
    const token = localStorage.getItem("auth_token");

    const response = await axios.post("/attendance-setting", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  };

  // 👥 USER CRUD
  const getAllUsers = async () => {
    const token = localStorage.getItem("auth_token");

    const response = await axios.get("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  };

  const createUser = async (data) => {
    const token = localStorage.getItem("auth_token");

    return axios.post("/users", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const updateUser = async (id, data) => {
    const token = localStorage.getItem("auth_token");

    return axios.put(`/users/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const deleteUser = async (id) => {
    const token = localStorage.getItem("auth_token");

    return axios.delete(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getAttendanceSetting,
        updateAttendanceSetting,
        getAllUsers,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
