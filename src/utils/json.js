// Utility: Load and validate festival JSON
import { festivalSchema } from '../pwa/schema';
export async function loadFestivalJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  return festivalSchema.parse(data);
}
