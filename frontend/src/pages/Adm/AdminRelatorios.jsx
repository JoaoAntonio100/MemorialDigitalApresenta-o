import React from 'react'
import AdminSidebar from './AdminSidebar';
import styles from './AdminDashboard.module.css';

const AdminRelatorios = () => {
    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />

            <main
                className={styles.mainContent}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    minHeight: '100vh'
                }}
            >
                <h1 style={{ textAlign: 'center' }}>Relatórios</h1>
            </main>
        </div>
    )
}

export default AdminRelatorios
