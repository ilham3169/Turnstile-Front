import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        membership_id: '',
        status: 'active',
    });

    const [membershipOptions, setMembershipOptions] = useState([]);
    const MEMBERSHIP_API_URL = 'http://127.0.0.1:8000/memberships';
    const WEBSOCKET_URL = 'ws://127.0.0.1:8081';

    // Fetch membership options
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

    // Set up WebSocket connection
    useEffect(() => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.readerId === 2 && !user) { 
                    setFormData(prevData => ({
                        ...prevData,
                        access_code: data.uid
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
    }, [user]);

    useEffect(() => {
        if (user) {
            setFormData({
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number || '',
                membership_id: membershipOptions.includes(user.membership_id) ? user.membership_id : (membershipOptions.length > 0 ? membershipOptions[0] : ''),
                status: user.status,
                entry_count: user.entry_count || 0,
            });
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                phone_number: '',
                membership_id: membershipOptions.length > 0 ? membershipOptions[0] : '',
                status: 'active',
                entry_count: 0,
            });
        }
    }, [user, membershipOptions]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name === 'access_code' || (!user && name === 'status')) return;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        });
    };

    const handleSubmit = (e) => {
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
                    name="access_code"
                    value={formData.access_code}
                    onChange={handleChange}
                    required
                    readOnly // Prevent manual edits
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