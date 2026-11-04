const enc = new TextEncoder();
const dec = new TextDecoder();

export async function deriveKey(passphrase: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

export async function encryptJSON(passphrase: string, data: unknown) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data))
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ct))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt))
  };
}

export async function decryptJSON<T>(passphrase: string, p: { ciphertext: string; iv: string; salt: string }): Promise<T> {
  const b = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const key = await deriveKey(passphrase, b(p.salt));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b(p.iv) }, key, b(p.ciphertext));
  return JSON.parse(dec.decode(pt));
    }
