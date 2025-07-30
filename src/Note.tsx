import { useState, useEffect } from 'react';
import { Button, Container, Grid, Box, TextField, Typography, Card, CardContent, MenuItem, Select, Autocomplete, Chip, Menu, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { marked } from 'marked';
import axiosInstance from './api/axiosInstance'; 
import { Note as NoteType } from './types/models';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const Note = () => {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [newNote, setNewNote] = useState<Partial<NoteType>>({ 
    title: '', 
    content: '', 
    categories: [],
    category: '' 
  });
  const [sortOption, setSortOption] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<string>('asc');
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
  }, [sortOption, sortOrder]);

  const handleSortChange = (field: string) => {
    if (sortOption === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(field);
      setSortOrder('asc');
    }
  };

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

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, note: NoteType) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNote(null);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNoteForDialog, setSelectedNoteForDialog] = useState<NoteType | null>(null);

  const handleCardClick = (note: NoteType) => (event: React.MouseEvent) => {
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

  const [previewMode, setPreviewMode] = useState(false);

  const renderMarkdown = (content: string) => {
    const sanitizedHtml = DOMPurify.sanitize(
      marked(content, { async: false }),
      { 
        ADD_ATTR: ['id'],
        FORBID_TAGS: ['script', 'iframe', 'form'],
        FORBID_ATTR: ['style', 'onerror', 'onload']
      }
    );
    return sanitizedHtml;
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
            if (errors.title && e.target.value.trim() !== '') {
              setErrors({ ...errors, title: undefined });
            }
          }}
          fullWidth
          margin="normal"
          error={Boolean(errors.title)}
          helperText={errors.title}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1">Content (Markdown supported)</Typography>
          <Button 
            size="small" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </Box>
        {previewMode ? (
          <Box 
            sx={{ 
              border: '1px solid #ccc', 
              borderRadius: 1, 
              p: 2, 
              minHeight: '150px',
              mb: 2,
              bgcolor: '#f8f9fa',
              '& h1': { fontSize: '2em', marginTop: '0.67em', marginBottom: '0.67em', fontWeight: 'bold' },
              '& h2': { fontSize: '1.5em', marginTop: '0.83em', marginBottom: '0.83em', fontWeight: 'bold' },
              '& h3': { fontSize: '1.17em', marginTop: '1em', marginBottom: '1em', fontWeight: 'bold' },
              '& h4': { fontSize: '1em', marginTop: '1.33em', marginBottom: '1.33em', fontWeight: 'bold' },
              '& h5': { fontSize: '0.83em', marginTop: '1.67em', marginBottom: '1.67em', fontWeight: 'bold' },
              '& h6': { fontSize: '0.67em', marginTop: '2.33em', marginBottom: '2.33em', fontWeight: 'bold' },
            }}
          >
            {newNote.content ? (
              <div 
                className="markdown-preview"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(newNote.content || '')
                }} 
              />
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No content to preview
              </Typography>
            )}
          </Box>
        ) : (
          <TextField
            label="Content"
            value={newNote.content}
            onChange={(e) => {
              setNewNote({ ...newNote, content: e.target.value });
              if (errors.content && e.target.value.trim() !== '') {
                setErrors({ ...errors, content: undefined });
              }
            }}
            fullWidth
            multiline
            rows={6}
            margin="normal"
            error={Boolean(errors.content)}
            helperText={errors.content || "Supports Markdown formatting (# headers, **bold**, *italic*, etc.)"}
            placeholder="# Title\n\n**Bold text** and *italic text*\n\n- List item\n- Another item\n\n1. Numbered item\n2. Second item\n\n```\nCode block\n```"
          />
        )}
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
                      event.stopPropagation();
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
                    position: 'relative',
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto'
                    },
                    '& code': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontFamily: 'monospace'
                    },
                    '& pre': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      padding: '8px',
                      borderRadius: '3px',
                      overflow: 'auto',
                      '& code': {
                        backgroundColor: 'transparent',
                        padding: 0
                      }
                    },
                  }}
                >
                  <div 
                    className="markdown-card-content"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(note.content.substring(0, 200))
                    }} 
                  />
                  {note.content.length > 200 && (
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
                      …
                    </Box>
                  )}
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
            <DialogContent dividers>
              <Box 
                sx={{ 
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto'
                  },
                  '& code': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontFamily: 'monospace'
                  },
                  '& pre': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '8px',
                    borderRadius: '3px',
                    overflow: 'auto',
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0
                    }
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    marginTop: '16px',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    lineHeight: 1.2
                  },
                  '& h1': { fontSize: '2em' },
                  '& h2': { fontSize: '1.5em' },
                  '& h3': { fontSize: '1.25em' },
                  '& ul, & ol': {
                    paddingLeft: '20px'
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    marginBottom: '16px'
                  },
                  '& th, & td': {
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f2f2f2'
                  },
                  '& blockquote': {
                    borderLeft: '3px solid #ccc',
                    padding: '0.5em 10px',
                    marginLeft: 0,
                    marginRight: 0,
                    backgroundColor: '#f9f9f9'
                  }
                }}
                className="markdown-dialog-content"
              >
                <div dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(selectedNoteForDialog.content)
                }} />
              </Box>
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
