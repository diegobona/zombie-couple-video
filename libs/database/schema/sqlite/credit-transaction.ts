import { InferSelectModel, InferInsertModel, sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { creditTransactionTypes } from "../../constants";

export { creditTransactionTypes };

export const creditTransaction = sqliteTable("credit_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  amount: text("amount").notNull(),
  balance: text("balance").notNull(),
  orderId: text("order_id"),
  description: text("description"),
  metadata: text("metadata", { mode: 'json' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("credit_transaction_purchase_order_id_idx")
    .on(table.orderId)
    .where(sql`${table.type} = 'purchase' AND ${table.orderId} IS NOT NULL`),
]);

export type CreditTransaction = InferSelectModel<typeof creditTransaction>;
export type NewCreditTransaction = InferInsertModel<typeof creditTransaction>;
