import React, { useState, useEffect } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardMode, setCardMode] = useState(false);
  const [cardReading, setCardReading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loginStatus, setLoginStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/users');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    
    fetchUsers();
  }, []);

  useEffect(() => {
    if (loginStatus === 'success') {
      setIsAuthenticated(true); 
      navigate('/dashboard');
    }
  }, [loginStatus, navigate, setIsAuthenticated])


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLoginStatus(null);
    setErrorMessage('');
  };

  const validateLogin = async (userId, password) => {
    try {
      const parsedId = parseInt(userId, 10);
      if (isNaN(parsedId)) {
        return { success: false, message: 'Invalid User ID format' };
      }

      const response = await fetch('http://localhost:8000/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const users = await response.json();

      const user = users.find(u => u.user_id === parsedId);
      if (!user) {
        return { success: false, message: 'İstifadəçi tapılmadı' };
      }
      if (user.password !== password) {
        return { success: false, message: 'Yanlış Şifrə' };
      }

      if(user.is_admin && user.status == "active"){

        setIsAuthenticated(true);

        await fetch(`http://127.0.0.1:8000/users/users/${userId}/last_entry`, {
            method: 'PATCH',
        });

        const message = `Reception Girişi - ADMIN \nUser ID : ${user.user_id}\nTam adı : ${user.first_name} ${user.last_name}`

        await axios.post("http://127.0.0.1:8000/telegram/send-message/", {
          text : message,
        });


        return { success: true, user };
      }
      else{
        return { success: false, message: 'Admin girişi deyil' };

      }
    } catch (error) {
      console.error('Failed to validate login:', error);
      return { success: false, message: 'Unable to connect to the server. Please try again later.' };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginStatus(null);
    setErrorMessage('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await validateLogin(formData.userId, formData.password); // Await the result
    
    if (result.success) {
      setLoginStatus('success');
     } else {
      setLoginStatus('error');
      setErrorMessage(result.message);
    }
    
    setIsLoading(false);
  };


  return (
    <div className="container">
      <div className="background-orb1"></div>
      <div className="background-orb2"></div>
      <div className="background-orb3"></div>

      <div className="card-wrapper">
        <div className="card">
          <div className="header">
            <div className="logo">
              <div className="logo-icon">
                <div className="logo-icon-inner"></div>
              </div>
            </div>
            <h1 className="title">Xoş gəldiniz</h1>
            <p className="subtitle">Hesabına giriş et</p>
          </div>

          {!cardMode ? (
            <div className="form-container">
              <div className="input-group">
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="User ID"
                  className="input"
                />
                <span className="input-icon">👤</span>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`submit-button ${isLoading ? 'disabled' : ''}`}
              >
                {isLoading ? (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    Giriş edilir...
                  </div>
                ) : (
                  'Giriş et'
                )}
              </button>
            </div>
          ) : (

            <div className="card-reader-container">
              <div>
                <div className={`card-slot ${cardReading ? 'reading' : ''}`}>
                  {cardReading ? (
                    <div className="spinner-large"></div>
                  ) : (
                    <span className="card-icon">💳</span>
                  )}
                </div>
                <p className="card-slot-text">
                  {cardReading ? 'Card oxunur...' : 'Kartınızı oxuyucuya yaxınlaşdırın'}
                </p>
              </div>

            </div>
          )}

          {loginStatus && (
            <div className={`status-message ${loginStatus}`}>
              {loginStatus === 'success' ? (
                <>
                  <span>✅</span>
                  <span>Giriş uğurlu!</span>
                </>
              ) : (
                <>
                  <span>❌</span>
                  <span>{errorMessage}</span>
                </>
              )}
            </div>
          )}

 
        </div>

        <div className="user-count">
          <p>
            {users.length > 0 ? `${users.length} users loaded from API` : 'Loading users...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;