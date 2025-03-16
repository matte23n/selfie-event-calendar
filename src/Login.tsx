import React from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { Link } from "react-router";

const Login: React.FC = () => {
    return (
        <Container maxWidth="xs">
            <Typography variant="h4" component="h2" gutterBottom>
                Login
            </Typography>
            <form action="/login" method="post">
                <TextField
                    label="Username"
                    name="username"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
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
