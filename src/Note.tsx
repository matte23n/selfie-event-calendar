import React, { useState } from 'react';
import { Button, Container, Grid2 as Grid, Box, TextField, Typography, Card, CardContent, CardActions } from '@mui/material';
import {marked} from 'marked';

interface Note {
  id: number;
  title: string;
  content: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const Note = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', categories: [] });

  const addNote = () => {
    const note: Note = {
      id: Date.now(),
      title: newNote.title,
      content: newNote.content,
      categories: newNote.categories,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes([...notes, note]);
    setNewNote({ title: '', content: '', categories: [] });
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const duplicateNote = (id: number) => {
    const noteToDuplicate = notes.find(note => note.id === id);
    if (noteToDuplicate) {
      const duplicatedNote = { ...noteToDuplicate, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
      setNotes([...notes, duplicatedNote]);
    }
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
        <Button variant="contained" color="primary" onClick={addNote}>Add Note</Button>
      </Box>
      <Grid container spacing={2}>
        {notes.map(note => (
          <Grid key={note.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">{note.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  <div dangerouslySetInnerHTML={{ __html: marked(note.content.substring(0, 200),{ async: false}) }} />
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => duplicateNote(note.id)}>Duplicate</Button>
                <Button size="small" onClick={() => deleteNote(note.id)}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Note;
