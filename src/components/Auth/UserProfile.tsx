import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

function UserProfile() {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async (): Promise<void> => {
    await signOut();
  };
  
  if (!user) return null;
  
  return (
    <div className="user-profile">
      <div className="user-email">{user.email}</div>
      <button onClick={handleSignOut} className="logout-button">Sign out</button>
    </div>
  );
}

export default UserProfile;
