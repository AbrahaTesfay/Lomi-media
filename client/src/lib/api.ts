export const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { credentials: 'include' });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Unable to load content.');
  return json as T;
}
export async function sendJson<T>(path: string, method: 'POST'|'PUT'|'DELETE', data?: unknown, csrf?: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token':csrf }: {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Unable to save.');
  return json as T;
}
export type Article = { id:number; slug:string; title:string; excerpt:string; body?:string; category:string; language:string; status?:string; created_at:string };
export type Campaign = { id:number; company:string; headline:string; description:string; link_url:string; placement:'homepage'|'news'|'sidebar'; status:'draft'|'active'|'paused'; payment_verified:number|boolean; start_date:string; end_date:string };
export type PortfolioItem = { id:number; title:string; category:string; description:string; case_url:string; status:'draft'|'published' };
export type Inquiry = { id:number; name:string; email:string; organization?:string;service?:string;message:string; created_at:string };
export type AdRequest = { id:number; company:string; name:string; email:string;website_url:string;placement:string;message:string;created_at:string };
