import React, { useState } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomTabBar } from './BottomTabBar';

interface LayoutProps {
  children: React.ReactNode;
  rightSidebarOpen?: boolean;
  onRightSidebarClose?: () => void;
  rightSidebarContent?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  rightSidebarOpen = false,
  onRightSidebarClose = () => {},
  rightSidebarContent,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar onMenuClick={handleDrawerToggle} />

      <LeftSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          pb: isMobile ? 10 : 3, // Extra padding for mobile bottom nav
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Right sidebar for thread viewer */}
      <RightSidebar
        open={rightSidebarOpen}
        onClose={onRightSidebarClose}
      >
        {rightSidebarContent}
      </RightSidebar>

      {/* Mobile bottom navigation */}
      {isMobile && <BottomTabBar />}
    </Box>
  );
};
