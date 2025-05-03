import React, { useState, useEffect } from 'react';
import { Button, Container, Grid2 as Grid, Box, TextField, Typography, Card, CardContent, CardActions, MenuItem, Select, Chip, Autocomplete } from '@mui/material';
import { marked } from 'marked';
import axiosInstance from './api/axiosInstance'; // Import axiosInstance

interface Note {
  _id: string; // Updated to match MongoDB's default ID field
  title: string;
  content: string;
  categories: string[];
}

const Note = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', categories: [] });
  const [sortOption, setSortOption] = useState<string>('title');
  const [categoryInput, setCategoryInput] = useState<string>(''); // Input for free category

  useEffect(() => {
    // Fetch notes from the backend
    const fetchNotes = async () => {
      try {
        const { data } = await axiosInstance.get('/notes'); // Use axiosInstance
        setNotes(data);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };
    fetchNotes();
  }, []);

  const addNote = async () => {
    try {
      const noteToInsert = {
        title: newNote.title,
        content: newNote.content,
        categories: newNote.categories,
        creation: new Date().toISOString(),
        lastMod: new Date().toISOString(),
      }
      const { data } = await axiosInstance.post('/notes', noteToInsert);
      setNotes([...notes, { _id: data.insertedId, ...noteToInsert, }]);
      setNewNote({ title: '', content: '', categories: [] });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/notes/${id}`);
      if (response.status === 200) {
        setNotes(notes.filter(note => note._id !== id));
      } else {
        console.error('Error deleting note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const duplicateNote = async (noteToDuplicate: Note) => {
    const { data } = await axiosInstance.post('/notes/duplicate', noteToDuplicate);
    setNotes([...notes, { ...data.duplicatedNote }]);
  };

  const copyNoteContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Notes</Typography>
        <TextField
          label="Title"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Content"
          value={newNote.content}
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
        <Autocomplete
          multiple
          freeSolo
          id="keyword-filter"
          options={[]}
          getOptionLabel={(option) => option}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Categories"
              fullWidth
            />
          )}
        />
        <Button variant="contained" color="primary" onClick={addNote} sx={{ mt: 2 }}>
          Add Note
        </Button>
        <Box mt={2}>
          <Typography variant="subtitle1">Sort by:</Typography>
          <Select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            displayEmpty
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="length">Content Length</MenuItem>
          </Select>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {notes.map(note => (
          <Grid key={note._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">{note.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  <div dangerouslySetInnerHTML={{ __html: marked(note.content.substring(0, 200), { async: false }) }} />
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => duplicateNote(note)}>Duplicate</Button>
                <Button size="small" onClick={() => deleteNote(note._id)}>Delete</Button>
                <Button size="small" onClick={() => copyNoteContent(note.content)}>Copy</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Note;
