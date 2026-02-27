import useSWR, { type SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export function useMetaApi<T>(
  endpoint: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(endpoint, fetcher, {
    revalidateOnFocus: false,
    ...config,
  });
}
