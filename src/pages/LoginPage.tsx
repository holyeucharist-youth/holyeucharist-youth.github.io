import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { CheckSquare } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true });
  }, [user, navigate]);

  async function handleSuccess(credentialResponse: { credential?: string }) {
    const idToken = credentialResponse.credential;
    if (!idToken) { setError('No credential received from Google. Please try again.'); return; }
    setSigningIn(true); setError('');
    try {
      await signIn(idToken);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const messages: Record<string, string> = {
          invalid_token:       'Invalid Google token. Please try again.',
          email_not_verified:  'Your Google email is not verified.',
          invalid_audience:    'Authentication configuration error — client ID mismatch.',
          domain_not_allowed:  'Your domain is not allowed to sign in.',
          account_disabled:    'Your account has been disabled. Contact your admin.',
          no_email:            'Google did not return an email address.',
          user_not_registered: 'Your account is not registered. Contact your admin to be added.',
          internal_error:      `Server error: ${err.message}`,
        };
        setError(messages[err.code] ?? `Sign-in failed (${err.code}): ${err.message}`);
      } else {
        setError(`Sign-in failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
        px: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%', maxWidth: 380,
          borderRadius: 3,
          border: '1px solid', borderColor: 'divider',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                bgcolor: 'primary.main', color: 'white',
                borderRadius: 2.5, p: 1.5, mb: 1.5,
                display: 'flex', alignItems: 'center',
              }}
            >
              <CheckSquare size={32} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Office Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Sign in to mark your attendance
            </Typography>
          </Box>

          {/* Google sign-in */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {signingIn ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2 }}>
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary">Signing in…</Typography>
              </Box>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError('Google Sign-In failed. Please try again.')}
                useOneTap={false}
                theme="outline"
                shape="rectangular"
                size="large"
                text="signin_with"
                width="280"
              />
            )}

            {error && (
              <Alert severity="error" sx={{ width: '100%', borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
