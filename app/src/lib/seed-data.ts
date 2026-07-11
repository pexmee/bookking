import type { EntryKind } from "./types";

export const DEFAULT_CATEGORIES: [string, EntryKind, string][] = [
  ["Salary", "income", "fixed_recurring"],
  ["Freelance", "income", "variable_recurring"],
  ["Other income", "income", "irregular"],
  ["Rent", "expense", "fixed_recurring"],
  ["Subscriptions", "expense", "fixed_recurring"],
  ["Utilities", "expense", "variable_recurring"],
  ["Groceries", "expense", "variable_recurring"],
  ["Transport", "expense", "variable_recurring"],
  ["Dining out", "expense", "discretionary"],
  ["Entertainment", "expense", "discretionary"],
  ["Travel", "expense", "irregular"],
  ["Health", "expense", "irregular"],
  ["Other", "expense", "irregular"],
];
