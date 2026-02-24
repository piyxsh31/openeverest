import { errorMessages } from 'utils/common-validation';

export const Messages = {
  previous: 'Previous',
  continue: 'Continue',
  createDatabase: 'Create database',
  editDatabase: 'Edit database',
  cancel: 'Cancel',
  dialog: {
    title: 'Are you sure you want to cancel?',
    content:
      'Cancelling will discard all your current changes to this database.',
    reject: 'No',
    accept: 'Yes, cancel',
  },
  errors: {
    endpoint: {
      invalid: 'Invalid URL',
    },
    dbName: {
      tooLong: errorMessages.tooLong('database'),
      duplicate: errorMessages.duplicate('database'),
    },
    monitoringEndpoint: {
      invalidOption:
        'Invalid option. Please make sure you added a monitoring endpoint and select it from the dropdown',
    },
    sharding: {
      invalid: 'Please fill in valid values for sharding',
      min: (val: number) => `The value cannot be less than ${val}`,
      max: (val: number) => `The value cannot be more than ${val}`,
      odd: 'The value cannot be even',
    },
  },
};
