import MuiPagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}

const PAGE_SIZES = [10, 20, 50];

export default function Pagination({ total, page, pageSize, onPage, onPageSize }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <Box sx={{ py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* top row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {total === 0 ? 'No records' : `${from}–${to} of ${total}`}
        </Typography>
        <Select
          value={pageSize}
          size="small"
          onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
          sx={{ fontSize: '0.75rem', '& .MuiSelect-select': { py: '4px' } }}
        >
          {PAGE_SIZES.map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s} per page</MenuItem>
          ))}
        </Select>
      </Box>

      {/* page buttons — centered */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <MuiPagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPage(p)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
            siblingCount={1}
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                fontWeight: 500,
                '&.Mui-selected': {
                  fontWeight: 700,
                  boxShadow: '0 0 0 2px rgba(37,99,235,0.25)',
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
