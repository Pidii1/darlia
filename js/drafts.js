// Saved projects (drafts) in the browser's own database, on this device only.
let dbP = null;
const db = () => (dbP ||= new Promise((res, rej) => {
  const r = indexedDB.open('rouge', 1);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('meta', { keyPath: 'id' }); d.createObjectStore('data', { keyPath: 'id' }); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const tx = async (stores, mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(stores, mode); let out; Promise.resolve(fn(t)).then((v) => (out = v)); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export async function listProjects() { try { const all = await tx(['meta'], 'readonly', (t) => req(t.objectStore('meta').getAll())); return (all || []).sort((a, b) => b.updated - a.updated); } catch (e) { return []; } }
export async function saveProject(meta, data) { await tx(['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').put(meta); t.objectStore('data').put(data); }); const all = await listProjects(); for (const m of all.slice(30)) await deleteProject(m.id); }
export async function loadProject(id) { return tx(['data'], 'readonly', (t) => req(t.objectStore('data').get(id))); }
export async function renameProject(id, name) {
  await tx(['meta', 'data'], 'readwrite', (t) => { const a = t.objectStore('meta'), b = t.objectStore('data'); const r1 = a.get(id); r1.onsuccess = () => { if (r1.result) a.put({ ...r1.result, name }); }; const r2 = b.get(id); r2.onsuccess = () => { if (r2.result) b.put({ ...r2.result, name }); }; });
}
export async function deleteProject(id) { return tx(['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').delete(id); t.objectStore('data').delete(id); }); }
export function ago(t) { const s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; const d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago'; }
