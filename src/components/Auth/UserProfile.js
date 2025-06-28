import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

function UserProfile() {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  if (!user) return null;
  
  return (
    <div className="user-profile">
      <div className="user-email">{user.email}</div>
      <button onClick={handleSignOut} className="logout-button">로그아웃</button>
    </div>
  );
}

export default UserProfile;
