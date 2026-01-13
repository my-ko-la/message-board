import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import { useThemeMode } from '../theme/ThemeContext';
import { useSession } from '../contexts/SessionContext';
import { UserRole } from '../utils/session';
import { UPDATE_USER } from '../graphql/mutations';

export const SettingsPage: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();
  const { session, updateUsername, updateRole } = useSession();
  const [newUsername, setNewUsername] = useState(session?.username || '');
  const [showSidebarOnReturn, setShowSidebarOnReturn] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);

  useEffect(() => {
    if (session) {
      setNewUsername(session.username);
    }
  }, [session]);

  const handleSaveUsername = async () => {
    if (!session?.userId || !newUsername || newUsername === session?.username) return;

    try {
      await updateUser({
        variables: {
          id: session.userId,
          username: newUsername,
        },
      });
      await updateUsername(newUsername);
      setSuccessMessage('Display name updated successfully!');
    } catch (error) {
      console.error('Failed to update username:', error);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!session?.userId) return;

    try {
      await updateUser({
        variables: {
          id: session.userId,
          role: newRole,
        },
      });
      updateRole(newRole);
      setSuccessMessage(`Role changed to ${newRole}!`);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (!session) {
    return (
      <Box>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Appearance Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
              />
            }
            label={`${mode === 'dark' ? 'Dark' : 'Light'} Mode`}
          />
        </CardContent>
      </Card>

      {/* User Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Profile
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Display Name"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              fullWidth
              disabled={updating}
            />
            <Button
              variant="contained"
              onClick={handleSaveUsername}
              disabled={!newUsername || newUsername === session.username || updating}
            >
              {updating ? 'Saving...' : 'Save Display Name'}
            </Button>

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth disabled={updating}>
              <InputLabel>Role (for testing)</InputLabel>
              <Select
                value={session.role}
                label="Role (for testing)"
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Change your role to test different permission levels
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* UI Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            UI Preferences
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showSidebarOnReturn}
                onChange={(e) => setShowSidebarOnReturn(e.target.checked)}
              />
            }
            label="Show conversation in sidebar when returning to homepage"
          />
        </CardContent>
      </Card>

      {/* Success notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
