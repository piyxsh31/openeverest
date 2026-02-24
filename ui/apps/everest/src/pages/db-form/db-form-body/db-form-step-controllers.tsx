import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Messages } from 'pages/database-form/database-form.messages';
import { DbFormStepControllersProps } from './db-form-step-controllers.types';

const DbFormStepControllers = ({
  disableBack,
  disableSubmit,
  disableCancel,
  disableNext,
  showSubmit,
  onPreviousClick,
  onNextClick,
  onCancel,
}: DbFormStepControllersProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
    <Button
      type="button"
      startIcon={<ArrowBackIcon />}
      variant="text"
      disabled={disableBack}
      onClick={onPreviousClick}
      sx={{ mr: 1 }}
      data-testid="db-wizard-previous-button"
    >
      {Messages.previous}
    </Button>
    <Box sx={{ flex: '1 1 auto' }} />
    <Button
      type="button"
      variant="outlined"
      disabled={disableCancel}
      data-testid="db-wizard-cancel-button"
      sx={{ mr: 1 }}
      onClick={onCancel}
    >
      {Messages.cancel}
    </Button>
    {showSubmit ? (
      <Button
        key="submit-btn"
        type="submit"
        variant="contained"
        disabled={disableSubmit}
        data-testid="db-wizard-submit-button"
      >
        {Messages.createDatabase}
      </Button>
    ) : (
      <Button
        key="continue-btn"
        type="button"
        onClick={onNextClick}
        variant="contained"
        disabled={disableNext}
        data-testid="db-wizard-continue-button"
      >
        {Messages.continue}
      </Button>
    )}
  </Box>
);

export default DbFormStepControllers;
