const jpeg = [0xff, 0xd8, 0xff];
const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const riff = [0x52, 0x49, 0x46, 0x46];
const webp = [0x57, 0x45, 0x42, 0x50];

export const maxProductImageBytes = 5 * 1024 * 1024;

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProductImageType = keyof typeof extensions;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectProductImage(bytes: Uint8Array): ProductImageType | null {
  if (bytes.length === 0 || bytes.length > maxProductImageBytes) {
    return null;
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

export function productImageExtension(type: ProductImageType) {
  return extensions[type];
}

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function productImagePath(businessId: string, productId: string, objectId: string, type: ProductImageType) {
  return `${businessId}/${productId}/${objectId}.${productImageExtension(type)}`;
}

export function isSafeProductImagePath(path: string) {
  return new RegExp(`^${uuid}/${uuid}/${uuid}\\.(jpg|png|webp)$`, "i").test(path);
}
