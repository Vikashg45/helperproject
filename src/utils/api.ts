export interface RecordType {
  [key: string]: string;
}

export interface ApiResponse {
  data: RecordType[];
  total: number;
}

export const getData = async (
  page: number,
  limit: number,
  search: string
): Promise<ApiResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  const res = await fetch(`http://localhost:3001/api/data?${params.toString()}`);

  if (!res.ok) throw new Error('Failed to fetch data');

  return res.json();
};
