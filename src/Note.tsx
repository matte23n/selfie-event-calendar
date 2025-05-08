import { useState, useEffect } from 'react';
import { Button, Container, Grid2 as Grid, Box, TextField, Typography, Card, CardContent, CardActions, MenuItem, Select, Autocomplete, Chip, Menu, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormHelperText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { marked } from 'marked';
import axiosInstance from './api/axiosInstance'; // Import axiosInstance
import { Note as NoteType } from './types/models';

const Note = () => {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [newNote, setNewNote] = useState<Partial<NoteType>>({ 
    title: '', 
    content: '', 
    categories: [],
    category: '' 
  });
  const [sortOption, setSortOption] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<string>('asc'); // New state for sort order

  // Add validation state
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
  }>({});

  const fetchNotes = async () => {
    try {
      const { data } = await axiosInstance.get<NoteType[]>('/notes', {
        params: { sortField: sortOption, sortOrder },
      });
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [sortOption, sortOrder]); // Refetch notes when sort option or order changes

  const handleSortChange = (field: string) => {
    if (sortOption === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); // Toggle sort order
    } else {
      setSortOption(field);
      setSortOrder('asc'); // Default to ascending order
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};
    
    if (!newNote.title || newNote.title.trim() === '') {
      newErrors.title = 'Title is required';
    }
    
    if (!newNote.content || newNote.content.trim() === '') {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addNote = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    
    try {
      const noteToInsert: NoteType = {
        title: newNote.title || '',
        category: newNote.category || '',
        content: newNote.content || '',
        creation: new Date().toISOString(),
        lastMod: new Date().toISOString(),
        categories: newNote.categories || []
      };
      const { data } = await axiosInstance.post('/notes', noteToInsert);
      setNotes([...notes, { _id: data.insertedId, ...noteToInsert }]);
      setNewNote({ title: '', content: '', categories: [], category: '' });
      // Clear errors after successful submission
      setErrors({});
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

  const duplicateNote = async (noteToDuplicate: NoteType) => {
    const { data } = await axiosInstance.post('/notes/duplicate', noteToDuplicate);
    setNotes([...notes, { ...data.duplicatedNote }]);
  };

  const copyNoteContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Add state for the menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);

  // Add menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, note: NoteType) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNote(null);
  };

  // Add state for the dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNoteForDialog, setSelectedNoteForDialog] = useState<NoteType | null>(null);

  // Dialog handlers
  const handleCardClick = (note: NoteType) => (event: React.MouseEvent) => {
    // Prevent opening dialog when clicking on the menu button
    if (!(event.target instanceof HTMLButtonElement) && 
        !event.currentTarget.querySelector('.MuiIconButton-root')?.contains(event.target as Node)) {
      setSelectedNoteForDialog(note);
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedNoteForDialog(null);
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Notes</Typography>
        <TextField
          label="Title"
          value={newNote.title}
          onChange={(e) => {
            setNewNote({ ...newNote, title: e.target.value });
            // Clear error when user starts typing
            if (errors.title && e.target.value.trim() !== '') {
              setErrors({ ...errors, title: undefined });
            }
          }}
          fullWidth
          margin="normal"
          error={Boolean(errors.title)}
          helperText={errors.title}
        />
        <TextField
          label="Content"
          value={newNote.content}
          onChange={(e) => {
            setNewNote({ ...newNote, content: e.target.value });
            // Clear error when user starts typing
            if (errors.content && e.target.value.trim() !== '') {
              setErrors({ ...errors, content: undefined });
            }
          }}
          fullWidth
          multiline
          rows={4}
          margin="normal"
          error={Boolean(errors.content)}
          helperText={errors.content}
        />
        <Autocomplete
          multiple
          freeSolo
          id="category-input"
          options={Array.from(new Set(notes.flatMap(note => note.categories || [])))}
          value={newNote.categories || []}
          onChange={(_, newValue) => setNewNote({ ...newNote, categories: newValue })}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Categories"
              fullWidth
            />
          )}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={addNote} 
          sx={{ mt: 2 }}
          disabled={!newNote.title || !newNote.content || newNote.title.trim() === '' || newNote.content.trim() === ''}
        >
          Add Note
        </Button>
        <Box mt={2}>
          <Typography variant="subtitle1">Sort by:</Typography>
          <Select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="creation">Creation Date</MenuItem>
            <MenuItem value="contentLength">Content Length</MenuItem>
          </Select>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {notes.map(note => (
          <Grid key={note._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ 
                height: '20vh', 
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
              onClick={handleCardClick(note)}
            >
              <CardContent sx={{ flex: '1 0 auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 1 
                }}>
                  <Typography variant="h5" component="div" sx={{ flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{note.title}</Typography>
                  <IconButton 
                    aria-label="more actions" 
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation(); // Prevent card click when clicking menu
                      handleMenuOpen(event, note);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Box 
                  sx={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    mb: 2,
                    flex: 1,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                    <div dangerouslySetInnerHTML={{ __html: marked(note.content.substring(0, 200), { async: false }) }} />
                  </Typography>
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      px: 1,
                      borderRadius: '4px'
                    }}
                  >
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
                  {note.categories && note.categories.map((category, index) => (
                    <Chip 
                      key={index} 
                      label={category} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Menu for note actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (selectedNote) duplicateNote(selectedNote);
            handleMenuClose();
          }}
        >
          Duplicate
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedNote && selectedNote._id) deleteNote(selectedNote._id);
            handleMenuClose();
          }}
        >
          Delete
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedNote) copyNoteContent(selectedNote.content);
            handleMenuClose();
          }}
        >
          Copy Content
        </MenuItem>
      </Menu>
      
      {/* Dialog for full note content */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        scroll="paper"
        maxWidth="md"
        fullWidth
      >
        {selectedNoteForDialog && (
          <>
            <DialogTitle>
              <Typography variant="h5">{selectedNoteForDialog.title}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {selectedNoteForDialog.categories && selectedNoteForDialog.categories.map((category, index) => (
                  <Chip 
                    key={index} 
                    label={category} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </DialogTitle>
            <DialogContent 
              dividers
            >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                  <div dangerouslySetInnerHTML={{ __html: marked(selectedNoteForDialog.content, { async: false }) }} />
                </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose} color="primary">Close</Button>
              <Button 
                onClick={() => {
                  copyNoteContent(selectedNoteForDialog.content);
                  handleDialogClose();
                }} 
                color="primary"
              >
                Copy Content
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Note;
