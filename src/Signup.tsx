import React from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { Link } from "react-router";

const Signup: React.FC = () => {
    return (
        <Container maxWidth="xs">
            <Typography variant="h4" component="h2" gutterBottom>
                Signup
            </Typography>
            <form action="/signup" method="post">
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
                <TextField
                    label="First Name"
                    name="firstName"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
                />
                <TextField
                    label="Last Name"
                    name="lastName"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    required
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
