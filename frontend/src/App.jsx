import React, { useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop"; 
import MainLayout from "./layout/MainLayout";
import HomePage from "../src/pages/HomePage";
import AllMemorialsPage from "../src/pages/AllMemorialsPage";
import MemorialPage from "../src/pages/MemorialPage";
import TumuloPage from "../src/pages/TumuloPage";
import MapPage from "../src/pages/MapPage";
import AdminDashboard from "../src/pages/Adm/AdminDashboard";
import AdminMemoriais from "../src/pages/Adm/AdminMemoriais";
import LoginPage from "./pages/LoginPage";

function AdminRoute({ isAuthenticated, children }) {
  const location = useLocation();

  if (isAuthenticated) {
    return children;
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname }}
    />
  );
}

function App() {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem("memorialAdminToken") || "";
  });

  const isAuthenticated = Boolean(token);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("memorialAdminToken", newToken);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("memorialAdminToken");
  };

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("memorialAdminToken");
      return;
    }

    localStorage.setItem("memorialAdminToken", token);
  }, [token]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout isAuthenticated={isAuthenticated} onLogout={handleLogout} />}>
          <Route index element={<HomePage />} />
          <Route path="memoriais/:id" element={<MemorialPage />} />
          <Route path="memoriais" element={<AllMemorialsPage />} />
          <Route path="tumulo/:localizacao" element={<TumuloPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        </Route>
        <Route
          path="admin"
          element={(
            <AdminRoute isAuthenticated={isAuthenticated}>
              <AdminDashboard />
            </AdminRoute>
          )}
        />
        <Route
          path="admin/memoriais"
          element={(
            <AdminRoute isAuthenticated={isAuthenticated}>
              <AdminMemoriais />
            </AdminRoute>
          )}
        />
      </Routes>
    </>
  );
}

export default App;
