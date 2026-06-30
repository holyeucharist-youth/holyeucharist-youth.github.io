import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Divider from '@mui/material/Divider';
import { UserPlus, Upload, Download, FileJson, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { getPref, setPref } from '../lib/prefs';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import type { User } from '../types';

const TEMPLATE_DATA = [
  { email: 'alice@company.com', role: 'USER',  name: 'Alice Johnson' },
  { email: 'bob@company.com',   role: 'ADMIN', name: 'Bob Smith'     },
  { email: 'carol@company.com', role: 'USER'                         },
];

type BulkResult = { ok: boolean; inserted: number; updated: number; errors: { email: string; error: string }[] };

const headSx = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'grey.50' };
const cellSx = { py: 1.5, fontSize: '0.875rem' };

function PanelHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={1} color="text.secondary">
          {title}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const [page, setPage]         = useState(() => getPref('users_page', 1));
  const [pageSize, setPageSize] = useState(() => getPref('users_pageSize', 10));
  function goPage(p: number) { setPage(p); setPref('users_page', p); }
  function goSize(s: number) { setPageSize(s); setPref('users_pageSize', s); setPage(1); setPref('users_page', 1); }

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole]   = useState<'USER' | 'ADMIN'>('USER');
  const [addError, setAddError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile]             = useState<File | null>(null);
  const [importParseError, setImportParseError] = useState('');
  const [importResult, setImportResult]         = useState<BulkResult | null>(null);

  const usersQ = useQuery({ queryKey: ['users'], queryFn: () => api<{ users: User[] }>('/api/v1/users') });

  const addMutation = useMutation({
    mutationFn: () => api('/api/v1/users', { method: 'POST', body: JSON.stringify({ email: newEmail.trim().toLowerCase(), role: newRole }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setNewEmail(''); setNewRole('USER'); setAddError(''); },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        const msgs: Record<string, string> = { user_already_exists: 'This email is already registered.', missing_email: 'Please enter an email address.' };
        setAddError(msgs[err.code] ?? `Failed: ${err.message}`);
      } else { setAddError('Failed to add user. Please try again.'); }
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (users: unknown[]) => api<BulkResult>('/api/v1/users/bulk', { method: 'POST', body: JSON.stringify({ users }) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['users'] }); setImportResult(data); setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; },
    onError: (err: unknown) => { setImportParseError(err instanceof ApiError ? err.message : 'Import failed.'); },
  });

  const roleMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      api(`/api/v1/users/${encodeURIComponent(email)}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: unknown) => { if (err instanceof ApiError && err.code === 'cannot_demote_last_admin') alert('Cannot demote the last admin.'); },
  });

  const activeMutation = useMutation({
    mutationFn: ({ email, isActive }: { email: string; isActive: boolean }) =>
      api(`/api/v1/users/${encodeURIComponent(email)}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  async function handleImport() {
    if (!importFile) return;
    setImportParseError(''); setImportResult(null);
    let parsed: unknown;
    try { parsed = JSON.parse(await importFile.text()); }
    catch { setImportParseError('Invalid JSON — check the file format.'); return; }
    const users = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { users?: unknown[] }).users) ? (parsed as { users: unknown[] }).users : null;
    if (!users) { setImportParseError('JSON must be an array or { "users": [...] }.'); return; }
    bulkMutation.mutate(users);
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(TEMPLATE_DATA, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'users_template.json' });
    a.click(); URL.revokeObjectURL(a.href);
  }

  function exportUsers() {
    const rows = (usersQ.data?.users ?? []).map((u) => ({ email: u.email, name: u.name, role: u.role, is_active: !!u.is_active }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `users_${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  }

  const allUsers   = usersQ.data?.users ?? [];
  const totalUsers = allUsers.length;
  const pagedUsers = allUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
        <Typography variant="caption" color="text.disabled">Admin › Users</Typography>
        <Typography variant="h6" fontWeight={700}>User Management</Typography>
      </Box>

      <Box sx={{ flex: 1, px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900 }}>

        {/* ── Add User ── */}
        <Card variant="outlined">
          <PanelHeader icon={<UserPlus size={14} color="#6b7280" />} title="Add User" />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Pre-register a user by email. They must sign in with this Google account.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Email address" type="email" placeholder="user@example.com"
                value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newEmail.trim()) addMutation.mutate(); }}
                sx={{ flex: '1 1 220px' }}
              />
              <FormControl sx={{ minWidth: 130 }}>
                <InputLabel>Role</InputLabel>
                <Select label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value as 'USER' | 'ADMIN')}>
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
              <MuiButton variant="contained" size="medium" sx={{ height: 40 }}
                disabled={!newEmail.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>
                {addMutation.isPending ? 'Adding…' : 'Add User'}
              </MuiButton>
            </Box>
            {addError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{addError}</Alert>}
            {addMutation.isSuccess && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>User added successfully.</Alert>}
          </Box>
        </Card>

        {/* ── Bulk Import ── */}
        <Card variant="outlined">
          <PanelHeader
            icon={<Upload size={14} color="#6b7280" />}
            title="Bulk Import"
            action={
              <MuiButton size="small" variant="outlined" color="primary" startIcon={<FileJson size={12} />}
                onClick={downloadTemplate} sx={{ fontSize: '0.75rem' }}>
                Template
              </MuiButton>
            }
          />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Upload a JSON array of <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{'{ email, role, name? }'}</code> objects.
              Existing emails update their role. Max 500 users.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <input ref={fileInputRef} type="file" accept=".json,application/json"
                onChange={(e) => { setImportResult(null); setImportParseError(''); setImportFile(e.target.files?.[0] ?? null); }}
                style={{ display: 'none' }} id="bulk-file-input" />
              <MuiButton variant="outlined" color="inherit" component="label" htmlFor="bulk-file-input"
                startIcon={<FileJson size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                {importFile ? importFile.name : 'Choose JSON file…'}
              </MuiButton>
              <MuiButton variant="contained" disabled={!importFile || bulkMutation.isPending} onClick={handleImport}>
                {bulkMutation.isPending ? 'Importing…' : 'Import'}
              </MuiButton>
              {importFile && (
                <MuiButton size="small" color="inherit" onClick={() => { setImportFile(null); setImportResult(null); setImportParseError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  Clear
                </MuiButton>
              )}
            </Box>

            {importParseError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{importParseError}</Alert>}
            {importResult && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Alert severity="success" icon={<CheckCircle2 size={16} />} sx={{ borderRadius: 2 }}>
                  <strong>{importResult.inserted}</strong> inserted · <strong>{importResult.updated}</strong> updated
                  {importResult.errors.length > 0 && <span style={{ color: '#b45309' }}> · {importResult.errors.length} skipped</span>}
                </Alert>
                {importResult.errors.length > 0 && (
                  <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
                    <strong>Skipped:</strong>{' '}
                    {importResult.errors.map((e, i) => <span key={i}>{e.email} ({e.error}){i < importResult.errors.length - 1 ? ', ' : ''}</span>)}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Card>

        {/* ── Registered Users ── */}
        <Card variant="outlined">
          <PanelHeader
            icon={null}
            title={`Registered Users${totalUsers > 0 ? ` (${totalUsers})` : ''}`}
            action={
              <MuiButton size="small" variant="outlined" color="inherit" startIcon={<Download size={12} />}
                disabled={totalUsers === 0} onClick={exportUsers}
                sx={{ fontSize: '0.75rem', borderColor: 'divider', color: 'text.secondary' }}>
                Export JSON
              </MuiButton>
            }
          />
          {usersQ.isLoading ? (
            <Box sx={{ py: 6 }}><Spinner size="lg" /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Name / Email', 'Role', 'Status', 'Active'].map((h) => (
                        <TableCell key={h} sx={headSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedUsers.map((u) => (
                      <TableRow key={u.email} hover>
                        <TableCell sx={cellSx}>
                          <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Select size="small" value={u.role}
                            onChange={(e) => roleMutation.mutate({ email: u.email, role: e.target.value })}
                            sx={{ fontSize: '0.8rem', '& .MuiSelect-select': { py: '4px' } }}>
                            <MenuItem value="USER" sx={{ fontSize: '0.8rem' }}>USER</MenuItem>
                            <MenuItem value="ADMIN" sx={{ fontSize: '0.8rem' }}>ADMIN</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Chip size="small" label={!!u.is_active ? 'Active' : 'Inactive'}
                            sx={!!u.is_active
                              ? { bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.7rem' }
                              : { bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Switch size="small" checked={!!u.is_active}
                            onChange={(e) => activeMutation.mutate({ email: u.email, isActive: e.target.checked })} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider />
              <Box sx={{ px: 2 }}>
                <Pagination total={totalUsers} page={page} pageSize={pageSize} onPage={goPage} onPageSize={goSize} />
              </Box>
            </>
          )}
        </Card>

      </Box>
    </Box>
  );
}
