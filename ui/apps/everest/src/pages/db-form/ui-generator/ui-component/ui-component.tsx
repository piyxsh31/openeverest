import { Box, MenuItem } from "@mui/material";
import { muiComponentMap, Component } from "pages/db-form/types";
import React from "react";
import { useFormContext } from "react-hook-form";

type ComponentByType<T extends Component['uiType']> = Extract<Component, { uiType: T }>;

export type ComponentProps<T extends Component['uiType'] = Component['uiType']> = {
  item: ComponentByType<T>;
  name: string;
};

function isSelectComponent(item: Component): item is ComponentByType<'select'> {
  return item.uiType === 'select';
}

// Remove generic from component declaration for simpler export
const UIComponent: React.FC<ComponentProps> = ({ item, name }) => {
  const { uiType, fieldParams } = item;
  const methods = useFormContext();
  const errors = methods?.formState?.errors || {};
  const error = errors[name]?.message as string | undefined;

  const MuiComponent = muiComponentMap[uiType];
  if (!MuiComponent) return null;

  // Type-safe handling of different field types
  const label = fieldParams?.label || '';

  // Handle select options - TypeScript now knows the exact type!
  const options = isSelectComponent(item)
    ? item.fieldParams.options.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))
    : undefined;

  return (
    <>
      {React.createElement(
        MuiComponent,
        {
          ...fieldParams,
          name,
          label,
          error: !!error,
          formControlProps: { sx: { minWidth: '450px', marginTop: '15px' } },
        },
        options
      )}
    </>
  );
};

export default UIComponent;