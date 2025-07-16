// Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserTable from './UserTable';
import UserForm from './UserForm';
import './Dashboard.css';

const API_URL = 'http://127.0.0.1:8000/users';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL);
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleFormSubmit = async (userData) => {
        try {
            if (editingUser) {
                await axios.put(`${API_URL}/${userData.user_id}`, userData);
            } else {
                await axios.post(API_URL, userData);
            }
            setIsFormOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`${API_URL}/${userId}`);
            } catch (err) {
                console.error('Error deleting user:', err);
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    if (loading) {
        return <div className="dashboard-container">Loading users...</div>;
    }

    if (error) {
        return <div className="dashboard-container error-message">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
                <button className="add-user-btn" onClick={handleAddUser}>
                    Add New User
                </button>
            </header>

            {isFormOpen && (
                <div className="form-modal">
                    <div className="form-modal-content">
                        <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
                        <UserForm
                            user={editingUser}
                            onSubmit={handleFormSubmit}
                            onCancel={() => {
                                setIsFormOpen(false);
                                setEditingUser(null);
                            }}
                        />
                    </div>
                </div>
            )}

            <section className="user-management">
                <UserTable
                    users={users}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </section>
        </div>
    );
};

export default Dashboard;