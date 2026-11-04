import type { Conversation, ImageJob } from "@v/shared";

const DB_NAME = "venice-local";
const VER = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, VER);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("conversations"))
        d.createObjectStore("conversations", { keyPath: "id" });
      if (!d.objectStoreNames.contains("images"))
        d.createObjectStore("images", { keyPath: "id" });
      if (!d.objectStoreNames.contains("meta"))
        d.createObjectStore("meta", { keyPath: "k" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => rej(r.error);
  });
}

export const store = {
  all: () => tx<Conversation[]>("conversations", "readonly", s => s.getAll()),
  put: (c: Conversation) => tx("conversations", "readwrite", s => s.put(c)),
  del: (id: string) => tx("conversations", "readwrite", s => s.delete(id)),
  images: () => tx<ImageJob[]>("images", "readonly", s => s.getAll()),
  putImage: (i: ImageJob) => tx("images", "readwrite", s => s.put(i)),
  meta: (k: string) => tx<any>("meta", "readonly", s => s.get(k)),
  setMeta: (k: string, v: unknown) => tx("meta", "readwrite", s => s.put({ k, v })),
  clear: async () => {
    await tx("conversations", "readwrite", s => s.clear());
    await tx("images", "readwrite", s => s.clear());
  }
};

export const uid = () => crypto.randomUUID();
