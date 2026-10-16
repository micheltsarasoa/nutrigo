import type { ItemPatchBatch, ShoppingItemInput } from "@nutrigo/shared";

// SPEC-005 "Offline sync" (AC-6 to AC-8). Changes are written to the queue first and sent when the
// network allows; the server resolves each item last-write-wins on updatedAt.
export type QueueOp =
  | {
      kind: "patch";
      isoWeek: string;
      id: number;
      patch: ItemPatchBatch[number]["patch"];
      updatedAt: string;
    }
  | {
      kind: "add";
      isoWeek: string;
      /** Negative, only meaningful until the item is created on the server. */
      tempId: number;
      input: ShoppingItemInput;
      updatedAt: string;
    };
export type StoredOp = QueueOp & { seq: number };

export type QueueStore = {
  add(op: QueueOp): Promise<void>;
  all(): Promise<StoredOp[]>;
  put(op: StoredOp): Promise<void>;
  remove(seqs: number[]): Promise<void>;
};

type Send = (method: string, url: string, body?: unknown) => Promise<Response>;

/** The queue lives in IndexedDB so it survives closing the app; tests and old browsers use memory. */
export function idbStore(): QueueStore {
  const open = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("nutrigo-sync", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("ops", {
          keyPath: "seq",
          autoIncrement: true,
        });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const run = async <T>(
    mode: IDBTransactionMode,
    use: (ops: IDBObjectStore) => IDBRequest<T>[],
  ) => {
    const db = await open();
    return new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction("ops", mode);
      const reqs = use(tx.objectStore("ops"));
      tx.oncomplete = () => {
        db.close();
        resolve(reqs.map((r) => r.result));
      };
      tx.onerror = () => reject(tx.error);
    });
  };
  return {
    add: async (op) => void (await run("readwrite", (s) => [s.add(op)])),
    all: async () =>
      (
        await run("readonly", (s) => [s.getAll() as IDBRequest<StoredOp[]>])
      )[0]!,
    put: async (op) => void (await run("readwrite", (s) => [s.put(op)])),
    remove: async (seqs) =>
      void (await run("readwrite", (s) => seqs.map((n) => s.delete(n)))),
  };
}

export function memoryStore(): QueueStore {
  let rows: StoredOp[] = [];
  let seq = 0;
  return {
    add: async (op) => void rows.push({ ...op, seq: ++seq }),
    all: async () => [...rows].sort((a, b) => a.seq - b.seq),
    put: async (op) =>
      void (rows = rows.map((r) => (r.seq === op.seq ? op : r))),
    remove: async (seqs) =>
      void (rows = rows.filter((r) => !seqs.includes(r.seq))),
  };
}

const url = (isoWeek: string) => `/api/shopping-lists/${isoWeek}/items`;

export function createSyncQueue(store: QueueStore, send: Send) {
  async function flushWeek(isoWeek: string, ops: StoredOp[]) {
    let added = 0;
    for (const op of ops) {
      if (op.kind !== "add") continue;
      const res = await send("POST", url(isoWeek), op.input);
      if (res.status === 404) return { dropped: true, added };
      if (!res.ok) throw new Error(String(res.status));
      const { id } = (await res.json()) as { id: number };
      // Later changes to this item now point at the real id; the add is done.
      for (const o of await store.all())
        if (o.kind === "patch" && o.id === op.tempId)
          await store.put({ ...o, id });
      await store.remove([op.seq]);
      added++;
    }
    const patches = (await store.all()).filter(
      (o): o is StoredOp & { kind: "patch" } =>
        o.kind === "patch" && o.isoWeek === isoWeek,
    );
    if (patches.length) {
      const res = await send(
        "PATCH",
        url(isoWeek),
        patches.map(({ id, patch, updatedAt }) => ({ id, patch, updatedAt })),
      );
      if (res.status !== 404 && !res.ok) throw new Error(String(res.status));
      await store.remove(patches.map((p) => p.seq));
    }
    return { dropped: false, added };
  }

  return {
    enqueue: (op: QueueOp) => store.add(op),
    pending: async () => (await store.all()).length,
    /** Sends every waiting change; on any failure all unsent changes stay queued. */
    async flush(): Promise<{ ok: true; added: number } | { ok: false }> {
      try {
        let added = 0;
        const weeks = [...new Set((await store.all()).map((o) => o.isoWeek))];
        for (const week of weeks) {
          const ops = (await store.all()).filter((o) => o.isoWeek === week);
          const done = await flushWeek(week, ops);
          if (done.dropped) await store.remove(ops.map((o) => o.seq));
          added += done.added;
        }
        return { ok: true, added };
      } catch {
        return { ok: false };
      }
    },
  };
}

export type SyncQueue = ReturnType<typeof createSyncQueue>;
