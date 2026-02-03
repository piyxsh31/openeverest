import { Stack } from '@mui/material';
import {
  ComponentGroup,
  GroupType,
} from 'components/ui-generator/ui-generator.types';
import React from 'react';
import { componentGroupMap } from '../constants';

export type UIGroupProps = {
  children: React.ReactNode;
  groupType?: GroupType;
  groupParams?: Record<string, any>;
  item?: ComponentGroup;
};

const UIGroup = ({ groupType, children, groupParams, item }: UIGroupProps) => {
  const Component = groupType ? componentGroupMap[groupType] : undefined;
  debugger;

  return (
    <>
      {Component ? (
        React.createElement(Component, {
          children,
          label: item?.name,
        })
      ) : (
        <Stack spacing={2}>{children}</Stack>
      )}
    </>
  );
};

export default UIGroup;
