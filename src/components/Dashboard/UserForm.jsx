import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        membership_id: '',
        status: 'active',
        password: 'test',
        uid: ''
    });

    const [membershipOptions, setMembershipOptions] = useState([]);
    const MEMBERSHIP_API_URL = 'http://127.0.0.1:8000/memberships';
    const CARD_API_URL = 'http://127.0.0.1:8000/rfid_cards';
    const WEBSOCKET_URL = 'ws://127.0.0.1:8081';

    useEffect(() => {
        const fetchMembershipOptions = async () => {
            try {
                const response = await axios.get(MEMBERSHIP_API_URL);
                const options = response.data.map(item => item.membership_id);
                setMembershipOptions(options);

                if (!user && options.length > 0) {
                    setFormData(prevData => ({
                        ...prevData,
                        membership_id: options[0]
                    }));
                }
            } catch (error) {
                console.error('Error fetching membership options:', error);
            }
        };

        fetchMembershipOptions();
    }, []);

    useEffect(() => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.readerId === 2) { 
                    setFormData(prevData => ({
                        ...prevData,
                        uid: data.uid
                    }));
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            ws.close();
        };
    }, []); 

    useEffect(() => {
        const fetchCardData = async () => {
            if (user && user.user_id) {
                try {
                    const response = await axios.get(`${CARD_API_URL}/${user.user_id}`);
                    setFormData(prevData => ({
                        ...prevData,
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number || '',
                        membership_id: membershipOptions.includes(user.membership_id) ? user.membership_id : (membershipOptions.length > 0 ? membershipOptions[0] : ''),
                        status: user.status,
                        entry_count: user.entry_count || 0,
                        password: 'test',
                        uid: response.data.card_id || '' 
                    }));
                } catch (error) {
                    console.error('Error fetching card data:', error);
                    setFormData(prevData => ({
                        ...prevData,
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number || '',
                        membership_id: membershipOptions.includes(user.membership_id) ? user.membership_id : (membershipOptions.length > 0 ? membershipOptions[0] : ''),
                        status: user.status,
                        entry_count: user.entry_count || 0,
                        password: 'test',
                        uid: '' 
                    }));
                }
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    membership_id: membershipOptions.length > 0 ? membershipOptions[0] : '',
                    status: 'active',
                    entry_count: 0,
                    password: 'test',
                    uid: ''
                });
            }
        };

        fetchCardData();
    }, [user, membershipOptions]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name === 'uid' || (!user && name === 'status')) return; // Prevent manual edits to uid
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
                <label>First Name:</label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Last Name:</label>
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Phone Number:</label>
                <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Membership ID:</label>
                <select
                    name="membership_id"
                    value={formData.membership_id}
                    onChange={handleChange}
                    required
                >
                    {membershipOptions.length > 0 ? (
                        membershipOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))
                    ) : (
                        <option value="">Loading memberships...</option>
                    )}
                </select>
            </div>
            <div className="form-group">
                <label>UID (RFID/QR):</label>
                <input
                    type="text"
                    name="uid"
                    value={formData.uid}
                    onChange={handleChange}
                    required
                    readOnly 
                />
            </div>
            <div className="form-group">
                <label>Status:</label>
                {!user ? (
                    <input
                        type="text"
                        name="status"
                        value={formData.status}
                        readOnly
                    />
                ) : (
                    <select name="status" value={formData.status} onChange={handleChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                )}
            </div>
            <div className="form-actions">
                <button type="submit">{user ? 'Update User' : 'Create User'}</button>
                <button type="button" onClick={onCancel} className="cancel-btn">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default UserForm;