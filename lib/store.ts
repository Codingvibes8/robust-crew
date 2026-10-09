import { Pool } from "pg";

export interface DocParagraph {
  id: number;
  type: "p" | "h1" | "h2" | "h3" | "li";
  text: string;
}

export interface DocumentRecord {
  id: string;
  ownerId: string;
  title: string;
  paragraphs: DocParagraph[];
  wordCount: number;
  sourceType: "paste" | "url" | "file";
  sourceUrl?: string;
  createdAt: string;
}

export interface SimplificationRecord {
  id: string;
  docId: string;
  level: "lighter" | "simpler" | "summary";
  items: Array<{ i: number; t: string }>;
  createdAt: string;
}

export interface Store {
  saveDocument(doc: Omit<DocumentRecord, "createdAt">): Promise<DocumentRecord>;
  getDocument(id: string, ownerId: string): Promise<DocumentRecord | null>;
  getSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary"
  ): Promise<SimplificationRecord | null>;
  saveSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary",
    items: Array<{ i: number; t: string }>
  ): Promise<SimplificationRecord>;
  getDailyUsageCount(anonId: string, dayDate: string): Promise<number>;
  recordDailyUsage(anonId: string, docId: string, dayDate: string): Promise<number>;
}

// In-Memory implementation
class MemoryStore implements Store {
  private docs = new Map<string, DocumentRecord>();
  private simplifications = new Map<string, SimplificationRecord>();
  private usage = new Set<string>(); // key: `${anonId}:${docId}:${dayDate}`

  async saveDocument(doc: Omit<DocumentRecord, "createdAt">): Promise<DocumentRecord> {
    const record: DocumentRecord = {
      ...doc,
      createdAt: new Date().toISOString(),
    };
    this.docs.set(record.id, record);
    return record;
  }

  async getDocument(id: string, ownerId: string): Promise<DocumentRecord | null> {
    const doc = this.docs.get(id);
    if (!doc || doc.ownerId !== ownerId) {
      return null;
    }
    return doc;
  }

  async getSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary"
  ): Promise<SimplificationRecord | null> {
    const key = `${docId}:${level}`;
    return this.simplifications.get(key) ?? null;
  }

  async saveSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary",
    items: Array<{ i: number; t: string }>
  ): Promise<SimplificationRecord> {
    const key = `${docId}:${level}`;
    const record: SimplificationRecord = {
      id: "simp_" + crypto.randomUUID().replace(/-/g, ""),
      docId,
      level,
      items,
      createdAt: new Date().toISOString(),
    };
    this.simplifications.set(key, record);
    return record;
  }

  async getDailyUsageCount(anonId: string, dayDate: string): Promise<number> {
    let count = 0;
    const prefix = `${anonId}:`;
    const suffix = `:${dayDate}`;
    for (const item of this.usage) {
      if (item.startsWith(prefix) && item.endsWith(suffix)) {
        count++;
      }
    }
    return count;
  }

  async recordDailyUsage(anonId: string, docId: string, dayDate: string): Promise<number> {
    const key = `${anonId}:${docId}:${dayDate}`;
    this.usage.add(key);
    return this.getDailyUsageCount(anonId, dayDate);
  }
}

// PostgreSQL implementation
class PgStore implements Store {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async saveDocument(doc: Omit<DocumentRecord, "createdAt">): Promise<DocumentRecord> {
    const query = `
      INSERT INTO documents (id, owner_id, title, paragraphs, word_count, source_type, source_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, owner_id as "ownerId", title, paragraphs, word_count as "wordCount", source_type as "sourceType", source_url as "sourceUrl", created_at as "createdAt"
    `;
    const res = await this.pool.query(query, [
      doc.id,
      doc.ownerId,
      doc.title,
      JSON.stringify(doc.paragraphs),
      doc.wordCount,
      doc.sourceType,
      doc.sourceUrl ?? null,
    ]);
    return res.rows[0];
  }

  async getDocument(id: string, ownerId: string): Promise<DocumentRecord | null> {
    const query = `
      SELECT id, owner_id as "ownerId", title, paragraphs, word_count as "wordCount", source_type as "sourceType", source_url as "sourceUrl", created_at as "createdAt"
      FROM documents
      WHERE id = $1 AND owner_id = $2
    `;
    const res = await this.pool.query(query, [id, ownerId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      paragraphs: typeof row.paragraphs === "string" ? JSON.parse(row.paragraphs) : row.paragraphs,
    };
  }

  async getSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary"
  ): Promise<SimplificationRecord | null> {
    const query = `
      SELECT id, doc_id as "docId", level, items, created_at as "createdAt"
      FROM simplifications
      WHERE doc_id = $1 AND level = $2
    `;
    const res = await this.pool.query(query, [docId, level]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    };
  }

  async saveSimplification(
    docId: string,
    level: "lighter" | "simpler" | "summary",
    items: Array<{ i: number; t: string }>
  ): Promise<SimplificationRecord> {
    const id = "simp_" + crypto.randomUUID().replace(/-/g, "");
    const query = `
      INSERT INTO simplifications (id, doc_id, level, items, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (doc_id, level) DO UPDATE
      SET items = EXCLUDED.items, created_at = NOW()
      RETURNING id, doc_id as "docId", level, items, created_at as "createdAt"
    `;
    const res = await this.pool.query(query, [id, docId, level, JSON.stringify(items)]);
    const row = res.rows[0];
    return {
      ...row,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    };
  }

  async getDailyUsageCount(anonId: string, dayDate: string): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT doc_id) as count
      FROM usage_records
      WHERE anon_id = $1 AND day_date = $2
    `;
    const res = await this.pool.query(query, [anonId, dayDate]);
    return parseInt(res.rows[0].count, 10) || 0;
  }

  async recordDailyUsage(anonId: string, docId: string, dayDate: string): Promise<number> {
    const query = `
      INSERT INTO usage_records (anon_id, doc_id, day_date, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (anon_id, doc_id, day_date) DO NOTHING
    `;
    await this.pool.query(query, [anonId, docId, dayDate]);
    return this.getDailyUsageCount(anonId, dayDate);
  }
}

// Global singleton instance so memory state persists across hot-reloads during dev
declare global {
  var __plainread_store__: Store | undefined;
}

function initStore(): Store {
  if (process.env.DATABASE_URL) {
    try {
      return new PgStore(process.env.DATABASE_URL);
    } catch (e) {
      console.warn("Failed to connect to Postgres, falling back to MemoryStore", e);
    }
  }
  return new MemoryStore();
}

export const store: Store = globalThis.__plainread_store__ ?? (globalThis.__plainread_store__ = initStore());
