import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const StaffModal = ({ open, onClose, handler, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (handler && handler.name) {
      setName(handler.name);
    } else {
      setName('');
    }
  }, [handler]);

  const handleSubmit = () => {
    const payload = handler?.id ? { ...handler, name } : { name };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{handler?.id ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffModal;
