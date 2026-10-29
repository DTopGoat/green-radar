const memory = new Map<string, unknown>();

export async function loadJson<T>(url: string): Promise<T> {
  const cached = memory.get(url);
  if (cached) return cached as T;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}`);
    const data = (await response.json()) as T;
    memory.set(url, data);
    try {
      localStorage.setItem(`gr:${url}`, JSON.stringify(data));
    } catch {
      /* private mode or quota */
    }
    return data;
  } catch (error) {
    try {
      const raw = localStorage.getItem(`gr:${url}`);
      if (raw) {
        const data = JSON.parse(raw) as T;
        memory.set(url, data);
        return data;
      }
    } catch {
      /* ignore broken cache */
    }
    throw error;
  }
}
