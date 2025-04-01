import React, { useState } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { Link, useNavigate } from "react-router";
import axiosInstance from './api/axiosInstance';

const Signup: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axiosInstance.post('/signup', formData);

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <Container maxWidth="xs">
            <Typography variant="h4" component="h2" gutterBottom>
                Signup
            </Typography>
            {error && (
                <Typography variant="body2" color="error" align="center">
                    {error}
                </Typography>
            )}
            <form onSubmit={handleSignup}>
                <TextField
                    label="Username"
                    name="username"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={formData.username}
                    onChange={handleChange}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={formData.password}
                    onChange={handleChange}
                />
                <TextField
                    label="First Name"
                    name="firstName"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                />
                <TextField
                    label="Last Name"
                    name="lastName"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                />
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Signup
                </Button>
            </form>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Already have an account? <Link to="/login">Login here</Link>
            </Typography>
        </Container>
    );
};

export default Signup;
