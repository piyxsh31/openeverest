import { useMemo } from 'react';
import { Divider, Drawer, Toolbar, useTheme } from '@mui/material';
import { useActiveBreakpoint } from 'hooks/utils/useActiveBreakpoint';
import { DbFormPreview } from '../db-form-preview/db-form-preview';
import { DbFormSideDrawerProps } from './db-form-side-drawer.types';

const DbFormSideDrawer = ({
  activeStep,
  longestAchievedStep,
  handleSectionEdit,
  disabled,
  stepsWithErrors,
}: DbFormSideDrawerProps) => {
  const theme = useTheme();
  const { isDesktop } = useActiveBreakpoint();

  const PreviewContent = useMemo(
    () => (
      <DbFormPreview
        disabled={disabled}
        activeStep={activeStep}
        longestAchievedStep={longestAchievedStep}
        onSectionEdit={handleSectionEdit}
        stepsWithErrors={stepsWithErrors}
        sx={{
          mt: 2,
          ...(!isDesktop && {
            padding: 0,
          }),
        }}
      />
    ),
    [
      disabled,
      activeStep,
      longestAchievedStep,
      handleSectionEdit,
      stepsWithErrors,
      isDesktop,
    ]
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: (theme) => `calc(25vw - ${theme.spacing(4)})`,
          flexShrink: 0,
          ml: 3,
          [`& .MuiDrawer-paper`]: {
            width: '25%',
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        {PreviewContent}
      </Drawer>
    );
  }

  return (
    <>
      <Divider
        orientation="horizontal"
        flexItem
        sx={{
          width: `calc(100% + ${theme.spacing(4 * 2)})`,
          ml: -4,
          mt: 6,
        }}
      />
      {PreviewContent}
    </>
  );
};

export default DbFormSideDrawer;
