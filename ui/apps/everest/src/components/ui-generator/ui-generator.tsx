import { Stack, Typography } from '@mui/material';
import { Section } from './ui-generator.types';
import { orderComponents } from './utils/ui-generator.utils';
import { renderComponent } from './utils/renderComponent';

type UIGeneratorProps = {
  activeStep: number;
  sections: { [key: string]: Section };
  stepLabels: string[];
};

export const UIGenerator = ({
  activeStep,
  sections,
  stepLabels,
}: UIGeneratorProps) => {
  debugger;
  const section = sections[stepLabels[activeStep]];
  const components = section?.components;

  //TODO we can handle different scenarios for section with empty ui components
  //TODO we should add a checking that uiType exists
  if (!components || Object.keys(components).length === 0) {
    return <Typography>No components available for this step</Typography>;
  }

  const orderedComponents = orderComponents(
    components,
    section?.componentsOrder
  );

  return (
    <Stack spacing={2}>
      {orderedComponents.map(([key, item]) => {
        debugger;
        console.log(key, item, Object.values(components));
        return renderComponent({
          key,
          item,
          name: key,
          siblings: Object.values(components),
        });
      })}
    </Stack>
  );
};
