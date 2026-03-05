import { createContext, useContext, ReactNode } from 'react';
import { Provider } from 'types/api';

type UiGeneratorContextValue = {
  providerObject?: Provider;
  loadingDefaultsForEdition?: boolean;
};

const UiGeneratorContext = createContext<UiGeneratorContextValue | null>(null);

type UiGeneratorProviderProps = {
  providerObject?: Provider;
  loadingDefaultsForEdition?: boolean;
  children: ReactNode;
};

export const UiGeneratorProvider = ({
  providerObject,
  loadingDefaultsForEdition,
  children,
}: UiGeneratorProviderProps) => {
  return (
    <UiGeneratorContext.Provider
      value={{ providerObject, loadingDefaultsForEdition }}
    >
      {children}
    </UiGeneratorContext.Provider>
  );
};

export const useUiGeneratorContext = () => {
  const context = useContext(UiGeneratorContext);
  // Context might be null if used outside provider, return empty object for safety
  return (
    context || { providerObject: undefined, loadingDefaultsForEdition: false }
  );
};
