import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDatabase } from "@/db";
import { extensionCaptureReceipts } from "@/db/schema";

const RECEIPT_LIFETIME_MS = 10 * 60 * 1_000;

export const extensionCaptureReceiptService = {
  async create(ownerId: string, extensionTokenId: string, inspirationId: string) {
    const db = await getDatabase();
    const now = new Date();
    const receipt = `mind_capture_${randomBytes(32).toString("base64url")}`;

    // Receipt validity is checked on read; this opportunistic cleanup keeps
    // the table bounded without introducing a scheduler for temporary records.
    await db.delete(extensionCaptureReceipts).where(lt(extensionCaptureReceipts.expiresAt, now));
    await db.insert(extensionCaptureReceipts).values({
      ownerId,
      inspirationId,
      extensionTokenId,
      receiptHash: hashReceipt(receipt),
      expiresAt: new Date(now.getTime() + RECEIPT_LIFETIME_MS)
    });

    return receipt;
  },

  async resolve(ownerId: string, extensionTokenId: string, receipt: string) {
    const db = await getDatabase();
    const [record] = await db
      .select({ inspirationId: extensionCaptureReceipts.inspirationId })
      .from(extensionCaptureReceipts)
      .where(and(
        eq(extensionCaptureReceipts.ownerId, ownerId),
        eq(extensionCaptureReceipts.extensionTokenId, extensionTokenId),
        eq(extensionCaptureReceipts.receiptHash, hashReceipt(receipt)),
        gt(extensionCaptureReceipts.expiresAt, new Date())
      ))
      .limit(1);
    return record ?? null;
  }
};

function hashReceipt(receipt: string) {
  return createHash("sha256").update(receipt).digest("hex");
}
