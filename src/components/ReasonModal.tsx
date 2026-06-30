import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import type { AttendanceStatus } from '../types';

interface ReasonModalProps {
  open: boolean;
  status: AttendanceStatus;
  onSubmit: (reason: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ReasonModal({
  open,
  status,
  onSubmit,
  onClose,
  loading,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');

  function handleSubmit() {
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reason for ${status.replace('_', ' ')}`}
    >
      <div className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter your reason..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            size="sm"
            loading={loading}
            disabled={!reason.trim()}
          >
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
