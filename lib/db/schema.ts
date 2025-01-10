import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const image = pgTable("images", {
  id: uuid().unique().primaryKey(),
  url: text(),
  meta: text(),
  userId: text(),
});
