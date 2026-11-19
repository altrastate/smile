import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectDocumentType,
  documentObjectPath,
  isSafeDocumentPath,
  maxDocumentBytes,
  safeDocumentName,
} from "./documents";

const userId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";
const objectId = "33333333-3333-4333-8333-333333333333";

describe("document contents", () => {
  it("recognises PDF, JPEG, PNG, and WebP signatures", () => {
    assert.equal(detectDocumentType(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d])), "application/pdf");
    assert.equal(detectDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
    assert.equal(
      detectDocumentType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])),
      "image/png",
    );
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    assert.equal(detectDocumentType(webp), "image/webp");
  });

  it("rejects empty files, HTML, executables, and files over 10 MB", () => {
    assert.equal(detectDocumentType(new Uint8Array()), null);
    assert.equal(detectDocumentType(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c])), null);
    assert.equal(detectDocumentType(Uint8Array.from([0x4d, 0x5a, 0x00, 0x00])), null);
    assert.equal(detectDocumentType(new Uint8Array(maxDocumentBytes + 1)), null);
  });

  it("keeps the stored name inside the caller's folder and drops path pieces", () => {
    assert.equal(safeDocumentName("../secret.html"), "secret.html");
    assert.equal(safeDocumentName("C:\\files\\licence.pdf"), "licence.pdf");
    const path = documentObjectPath(userId, applicationId, objectId, "application/pdf");
    assert.equal(isSafeDocumentPath(path), true);
    assert.equal(isSafeDocumentPath(`${userId}/../${applicationId}/file.pdf`), false);
    assert.equal(isSafeDocumentPath(`${userId}/${applicationId}/notes.html`), false);
  });
});
