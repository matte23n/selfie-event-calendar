import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { Link, useNavigate } from "react-router";
import axiosInstance from './api/axiosInstance';
import { useAuth } from './AuthProvider';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/calendario', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axiosInstance.post('/login', { username, password });
            login(response.data.token);
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <Container maxWidth="xs">
            <Typography variant="h4" component="h2" gutterBottom>
                Login
            </Typography>
            {error && (
                <Typography variant="body2" color="error" align="center">
                    {error}
                </Typography>
            )}
            <form onSubmit={handleLogin}>
                <TextField
                    label="Username"
                    name="username"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Login
                </Button>
            </form>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Don't have an account? <Link to="/signup">Signup here</Link>
            </Typography>
        </Container>
    );
};

export default Login;
