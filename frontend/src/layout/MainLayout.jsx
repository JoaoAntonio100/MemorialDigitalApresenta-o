import { Outlet } from "react-router-dom";
import Header from "../components/Header"; 
import Footer from "../components/Footer"; 
import styles from "./MainLayout.module.css";

function MainLayout({ isAuthenticated, onLogout }) {
    return (
        <div className={styles.layoutWrapper}>
            <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
            
            <main className={styles.mainContent}>
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;