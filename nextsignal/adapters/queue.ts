import type { QueueAdapter } from "@gotch/nextsignal";

// Queue adapters are optional until you add distributed processes.
//
// In production, this adapter owns infrastructure behavior:
// - enqueue/publish
// - worker subscription
// - retries
// - locks
// - dead letters
// - polling/backoff
//
// Examples you can build later:
// - pg-boss
// - BullMQ
// - SQS
// - Postgres table queue
export const queueAdapter: QueueAdapter | undefined = undefined;
