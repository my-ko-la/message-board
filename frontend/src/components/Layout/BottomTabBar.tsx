import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ForumIcon from '@mui/icons-material/Forum';
import SettingsIcon from '@mui/icons-material/Settings';

const paths = ['/', '/conversations', '/settings'];

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentIndex = (): number => {
    if (location.pathname === '/') return 0;
    if (location.pathname.startsWith('/conversations') || location.pathname.startsWith('/conversation/')) return 1;
    if (location.pathname === '/settings') return 2;
    return 0;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getCurrentIndex()}
        onChange={(_, newValue) => {
          navigate(paths[newValue]);
        }}
        showLabels
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="All" icon={<ForumIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};
