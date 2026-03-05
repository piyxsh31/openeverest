import { Button } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Messages } from './configure-more.messages';

export const ConfigureMore = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick}>
      {Messages.configMore}
      <EditOutlinedIcon
        sx={{
          verticalAlign: 'text-bottom',
          pl: 1,
        }}
        fontSize="medium"
        data-testid={`config-more-button`}
      />
    </Button>
  );
};

export default ConfigureMore;
