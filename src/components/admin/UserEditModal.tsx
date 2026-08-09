import React from 'react';
import { CorperProfile } from '../../types/corper';
import { EditCorperProfileModal } from './EditCorperProfileModal';

interface UserEditModalProps {
  user: CorperProfile | null;
  onClose: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose }) => {
  return <EditCorperProfileModal user={user} onClose={onClose} />;
};

