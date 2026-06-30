import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3, m: { xs: 0, sm: 2 }, width: '100%', maxHeight: '90vh' } } }}
    >
      {title && (
        <DialogTitle sx={{ pb: 1, pr: 6, fontWeight: 700, fontSize: '1.05rem' }}>
          {title}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
            aria-label="Close"
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ pt: title ? 1 : 3 }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
