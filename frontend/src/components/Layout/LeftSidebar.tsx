import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ForumIcon from '@mui/icons-material/Forum';
import SettingsIcon from '@mui/icons-material/Settings';

const DRAWER_WIDTH = 240;

export type Page = 'home' | 'conversations' | 'settings';

interface LeftSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems: Array<{ id: Page; label: string; icon: React.ReactNode; path: string }> = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
  { id: 'conversations', label: 'All Conversations', icon: <ForumIcon />, path: '/conversations' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  mobileOpen,
  onMobileClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = (): Page => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/conversations') || location.pathname.startsWith('/conversation/')) return 'conversations';
    if (location.pathname === '/settings') return 'settings';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileClose();
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};
