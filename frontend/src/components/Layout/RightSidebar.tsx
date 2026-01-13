import React from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const MAX_WIDTH_PERCENT = 35;

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ open, onClose, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Disable right sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: open ? `${MAX_WIDTH_PERCENT}vw` : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: `${MAX_WIDTH_PERCENT}vw`,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Toolbar />
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Thread View
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
        {children || (
          <Typography color="text.secondary">
            Click the sidebar icon on any message to view it here
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};
