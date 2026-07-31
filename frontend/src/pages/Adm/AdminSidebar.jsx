import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {LayoutDashboard, Users, Home, ChevronRight, ChevronLeft} from 'lucide-react';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeOnMobile = () => setIsOpen(false);

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}

            {/* A Barra Lateral */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                
                <button className={styles.trayToggle} onClick={toggleSidebar}>
                    {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                </button>

                <div className={styles.sidebarHeader}>
                    <h2>Admin Menu</h2>
                </div>
                
                <nav className={styles.sidebarNav}>
                    <NavLink 
                        to="/admin" 
                        end
                        onClick={closeOnMobile}
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>

                    <NavLink 
                        to="/admin/memoriais" 
                        onClick={closeOnMobile}
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <Users size={20} /> Memoriais
                    </NavLink>
                </nav>
                
                <div className={styles.sidebarFooter}>
                    <button className={styles.navItem} onClick={() => navigate("/")}>
                        <Home size={20} /> Voltar ao início
                    </button>
                </div>
            </aside>
        </>
    );
}