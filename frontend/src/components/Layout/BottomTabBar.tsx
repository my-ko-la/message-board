import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ForumIcon from '@mui/icons-material/Forum';
import SettingsIcon from '@mui/icons-material/Settings';
import { Page } from './LeftSidebar';

interface BottomTabBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentPage, onNavigate }) => {
  const pageToIndex: Record<Page, number> = {
    home: 0,
    conversations: 1,
    settings: 2,
  };

  const indexToPage: Page[] = ['home', 'conversations', 'settings'];

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
        value={pageToIndex[currentPage]}
        onChange={(_, newValue) => {
          onNavigate(indexToPage[newValue]);
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
