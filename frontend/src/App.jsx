import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop"; 
import MainLayout from "./layout/MainLayout";
import HomePage from "../src/pages/HomePage";
import AllMemorialsPage from "../src/pages/AllMemorialsPage";
import MemorialPage from "../src/pages/MemorialPage";
import TumuloPage from "../src/pages/TumuloPage";
import MapPage from "../src/pages/MapPage";
import AdminDashboard from "../src/pages/Adm/AdminDashboard";
import AdminMemoriais from "../src/pages/Adm/AdminMemoriais";
import AdminRelatorios from "./pages/Adm/AdminRelatorios";
import AdminConfig from "./pages/Adm/AdminConfig";
import LoginPage from "./pages/LoginPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("isAdminAuthenticated") === "true";
  });

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAdminAuthenticated");
  };

  useEffect(() => {
    localStorage.setItem("isAdminAuthenticated", String(isAuthenticated));
  }, [isAuthenticated]);

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
          <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
        </Route>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/memoriais" element={<AdminMemoriais />} />
        <Route path="admin/relatorios" element={<AdminRelatorios />} />
        <Route path="admin/configuracoes" element={<AdminConfig />} />
      </Routes>
    </>
  );
}

export default App;