import { useQuery } from "@tanstack/react-query";
import { getProvidersFn } from "api/providerApi";
import { PerconaQueryOptions } from "shared-types/query.types";

export const useProviders = (
  options?: PerconaQueryOptions<any, unknown, any>,
) => {
  return useQuery<any, unknown, any>({
    queryKey: ['providers'],
    queryFn: () => getProvidersFn(),
    retry: 3,
    ...options,
  });
};