// Dashboard/UserTable.jsx
import React from 'react';
import moment from 'moment';

const UserTable = ({ users, onEdit, onDelete }) => {
    return (
        <div className="table-container">
            <h3>User List</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Membership ID</th>
                        <th>Status</th>
                        <th>Entry Count</th>
                        <th>Last Entry</th>
                        <th>Inside</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            <td>{user.user_id}</td>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.membership_id}</td>
                            <td>
                                <span className={`status ${user.status}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td>{user.entry_count}</td>
                            <td>
                                {user.last_entry
                                    ? moment(user.last_entry).format('MMM D, YYYY HH:mm:ss')
                                    : 'N/A'}
                            </td>
                            <td>
                                {user.is_inside ? "Yes" : "No"}
                            </td>
                            <td className="actions">
                                <button className="edit-btn" onClick={() => onEdit(user)}>
                                    Edit
                                </button>
                                <button className="delete-btn" onClick={() => onDelete(user.user_id)}>
                                    Delete
                                </button>

                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;