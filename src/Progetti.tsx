import React, { useState, useEffect } from 'react';
import { Button, Container, Grid, Box, TextField, Typography, Card, CardContent, CardActions, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import axiosInstance from './api/axiosInstance';
import { Project } from './types/models';

const Progetti = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    deadline: new Date().toISOString().slice(0, 16),
    status: 'not-started'
  });
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async () => {
    try {
      const projectToAdd = {
        ...newProject,
        deadline: new Date(newProject.deadline || '').toISOString()
      };
      
      await axiosInstance.post('/projects', projectToAdd);
      
      // Reset form
      setNewProject({
        name: '',
        description: '',
        deadline: new Date().toISOString().slice(0, 16),
        status: 'not-started'
      });
      
      // Refresh projects list
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    try {
      const project = projects.find(p => p._id === projectId);
      if (!project) return;

      await axiosInstance.put(`/projects/${projectId}`, {
        ...project,
        status: newStatus
      });
      
      // Update local state
      setProjects(projects.map(p => 
        p._id === projectId ? { ...p, status: newStatus as 'not-started' | 'in-progress' | 'completed' } : p
      ));
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return '#f44336'; // Red
      case 'in-progress': return '#ff9800'; // Orange
      case 'completed': return '#4caf50'; // Green
      default: return '#2196f3'; // Blue
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Projects</Typography>
        <TextField
          label="Project Name"
          value={newProject.name}
          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          fullWidth
          multiline
          rows={2}
          margin="normal"
        />
        <TextField
          label="Deadline"
          type="datetime-local"
          value={newProject.deadline}
          onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={newProject.status}
            onChange={(e) => setNewProject({ ...newProject, status: e.target.value as 'not-started' | 'in-progress' | 'completed' })}
            label="Status"
          >
            <MenuItem value="not-started">Not Started</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleAddProject} sx={{ mt: 2 }}>
          Add Project
        </Button>
      </Box>
      
      {loading ? (
        <Typography>Loading projects...</Typography>
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid key={project._id} size={{xs:12, md:6, lg:4}}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{project.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {project.description}
                  </Typography>
                  <Typography variant="body2">
                    Deadline: {new Date(project.deadline).toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(project.status || ''),
                        mr: 1
                      }}
                    />
                    <Typography variant="body2">
                      Status: {project.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <FormControl size="small" sx={{ width: 120 }}>
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && project._id) {
                          handleUpdateStatus(project._id, e.target.value);
                        }
                      }}
                      label="Update Status"
                    >
                      <MenuItem value="not-started">Not Started</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                  <Button size="small" color="error" onClick={() => project._id && handleDeleteProject(project._id)}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {projects.length === 0 && (
            <Grid size={{xs:12}}>
              <Typography variant="body1" align="center">
                No projects found. Create a new project to get started!
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Progetti;
