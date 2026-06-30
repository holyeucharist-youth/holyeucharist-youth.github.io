import MuiCard from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';
import type { ReactNode } from 'react';

interface Props extends Omit<CardProps, 'className'> {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className, sx, ...rest }: Props) {
  return (
    <MuiCard
      variant="outlined"
      sx={{ borderRadius: 2, ...sx }}
      className={className}
      {...rest}
    >
      {children}
    </MuiCard>
  );
}
