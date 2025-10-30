// src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL;

export async function getData(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error("Erreur API");
  }
  return res.json();
}
