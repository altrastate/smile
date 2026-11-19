const pdf = [0x25, 0x50, 0x44, 0x46];
const jpeg = [0xff, 0xd8, 0xff];
const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const riff = [0x52, 0x49, 0x46, 0x46];
const webp = [0x57, 0x45, 0x42, 0x50];

export const maxDocumentBytes = 10 * 1024 * 1024;

const types = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type DocumentType = keyof typeof types;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectDocumentType(bytes: Uint8Array): DocumentType | null {
  if (bytes.length === 0 || bytes.length > maxDocumentBytes) {
    return null;
  }
  if (startsWith(bytes, pdf)) {
    return "application/pdf";
  }
  if (startsWith(bytes, jpeg)) {
    return "image/jpeg";
  }
  if (startsWith(bytes, png)) {
    return "image/png";
  }
  if (startsWith(bytes, riff) && startsWith(bytes, webp, 8)) {
    return "image/webp";
  }
  return null;
}

export function documentExtension(type: DocumentType) {
  return types[type];
}

export function safeDocumentName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "").replace(/^\.+/, "").slice(0, 80);
  return cleaned || "document";
}

export function documentObjectPath(userId: string, applicationId: string, objectId: string, type: DocumentType) {
  return `${userId}/${applicationId}/${objectId}.${documentExtension(type)}`;
}

export function isSafeDocumentPath(path: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png|webp)$/i.test(
    path,
  );
}
