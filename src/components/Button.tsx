import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  children:  ReactNode;
  fullWidth?: boolean;
}

const muiVariant: Record<Variant, MuiButtonProps['variant']> = {
  primary:   'contained',
  secondary: 'outlined',
  danger:    'contained',
  ghost:     'text',
};

const muiColor: Record<Variant, MuiButtonProps['color']> = {
  primary:   'primary',
  secondary: 'inherit',
  danger:    'error',
  ghost:     'inherit',
};

const muiSize: Record<Size, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export default function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  fullWidth = false,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <MuiButton
      variant={muiVariant[variant]}
      color={muiColor[variant]}
      size={muiSize[size]}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      {...rest}
    >
      {children}
    </MuiButton>
  );
}
