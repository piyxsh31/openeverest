import { createContext, useContext } from 'react';
import {
  Section,
  TopologyUISchemas,
} from 'components/ui-generator/ui-generator.types';
import { Provider } from 'types/api';

type DatabaseFormContextType = {
  uiSchema: TopologyUISchemas;
  topologies: string[];
  hasMultipleTopologies: boolean;
  defaultTopology: string;
  sections: { [key: string]: Section };
  sectionsOrder?: string[];
  providerObject?: Provider;
};

const DatabaseFormContext = createContext<DatabaseFormContextType | null>(null);

export const DatabaseFormProvider = DatabaseFormContext.Provider;

export const useDatabaseFormContext = () => {
  const context = useContext(DatabaseFormContext);
  if (!context) {
    throw new Error(
      'useDatabaseFormContext must be used within DatabaseFormProvider'
    );
  }
  return context;
};
