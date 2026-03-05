import { createContext, useContext, ReactNode } from 'react';
import { Provider } from 'types/api';

type UiGeneratorContextValue = {
  providerObject?: Provider;
};

const UiGeneratorContext = createContext<UiGeneratorContextValue | null>(null);

type UiGeneratorProviderProps = {
  providerObject?: Provider;
  children: ReactNode;
};

export const UiGeneratorProvider = ({
  providerObject,
  children,
}: UiGeneratorProviderProps) => {
  return (
    <UiGeneratorContext.Provider value={{ providerObject }}>
      {children}
    </UiGeneratorContext.Provider>
  );
};

export const useUiGeneratorContext = () => {
  const context = useContext(UiGeneratorContext);
  // Context might be null if used outside provider, return empty object for safety
  return context || { providerObject: undefined };
};
