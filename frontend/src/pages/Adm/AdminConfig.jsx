import React from 'react'
import AdminSidebar from './AdminSidebar';
import styles from './AdminDashboard.module.css';

const AdminConfig = () => {
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
                <h1 style={{ textAlign: 'center' }}>Configurações</h1>
            </main>
        </div>
    )
}

export default AdminConfig
