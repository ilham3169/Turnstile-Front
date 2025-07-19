// Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserTable from './UserTable';
import UserForm from './UserForm';
import './Dashboard.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



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
                const editData = {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone_number: userData.phone_number,
                    membership_id: userData.membership_id,
                    status: userData.status,
                    uid: userData.uid
                } 
                console.log(editData)
                await axios.patch(`http://127.0.0.1:8000/users/edit/fully/${userData.user_id}`, editData)
            } else {
                try{
                    const response = await axios.get(`http://127.0.0.1:8000/rfid_cards/uid/${userData.uid}`)
                    toast.warn("This card has been used", {
                        position: "top-right",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "colored",
                    });
                    return

                }catch(error){
                    if(error.response.data.detail == "Card not found"){
                        const response = await axios.post("http://127.0.0.1:8000/users/user/create", userData);

                        if (response.status !== 200) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        const new_user_id = response.data.user_id;
        
                        let rfidData = {
                            card_id: userData.uid,
                            user_id: new_user_id,
                        };

                        await axios.post('http://127.0.0.1:8000/rfid_cards/create', rfidData);
                        await axios.patch(`http://127.0.0.1:8000/users/edit/set_entry/${new_user_id}`);
        
                        const message = `Yeni müştəri qeydiyyatı\n👤 Ad Soyad: ${response.data.first_name} ${response.data.last_name}\nQeydiyyat növü : ${response.data.membership_id}`;
                        await axios.post("http://127.0.0.1:8000/telegram/send-message/", { text: message });
                    }   
                }
                
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
                await axios.delete(`http://127.0.0.1:8000/users/user/delete/${userId}`);
                fetchUsers(); 
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

    const refresh = () => {
        fetchUsers();
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
                <button className="refresh-btn" onClick={refresh}>Refresh</button>
                <button className="add-user-btn" onClick={handleAddUser}>Add New User</button>
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
            <ToastContainer />
        </div>
    );
};

export default Dashboard;
