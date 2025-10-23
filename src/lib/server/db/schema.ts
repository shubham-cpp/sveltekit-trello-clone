import { PRIORITY_VALUES } from '$lib/zod-schemas'
import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp_ms',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp_ms',
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const board = sqliteTable(
  'board',
  {
    id: text().primaryKey().$defaultFn(nanoid),

    title: text().notNull(),
    description: text(),
    color: text().default('bg-blue-500'),
    isDeleted: integer({ mode: 'boolean' }).default(false),

    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    createdAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  t => [
    // Index for fetching user's boards
    index('board_user_id_idx').on(t.userId),
    // Composite index for filtering non-deleted boards by user
    index('board_user_id_is_deleted_idx').on(t.userId, t.isDeleted),
  ],
)

/**
 * In the video, this is referred to as "columns" table
 */
export const boardColumn = sqliteTable(
  'board_column',
  {
    id: text().primaryKey().$defaultFn(nanoid),

    title: text().notNull(),
    sort_order: integer().default(0), // to handle the order of columns. Like should "TODO" column display before "WORK" column, etc

    boardId: text()
      .notNull()
      .references(() => board.id, { onDelete: 'cascade' }),

    createdAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  t => [
    // Index for fetching columns by board (critical for your main query)
    index('board_column_board_id_idx').on(t.boardId),
    // Composite index for fetching and sorting columns by board
    index('board_column_board_id_sort_order_idx').on(
      t.boardId,
      t.sort_order,
    ),
  ],
)

// TODO: add comments to task
export const task = sqliteTable(
  'task',
  {
    id: text().primaryKey().$defaultFn(nanoid),

    title: text().notNull(),
    description: text(),

    sort_order: integer().default(0),
    due_date: integer({ mode: 'timestamp_ms' }),
    priority: text({ enum: PRIORITY_VALUES }).default('low'),

    owner: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignee: text().references(() => user.id, { onDelete: 'set null' }),

    boardId: text()
      .notNull()
      .references(() => board.id, { onDelete: 'cascade' }),
    boardColumnId: text()
      .notNull()
      .references(() => boardColumn.id, { onDelete: 'cascade' }),

    createdAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  t => [
    unique('task_board_column_id_sort_order_unique').on(t.boardColumnId, t.boardId, t.sort_order),
    // Index for fetching tasks by board
    index('task_board_id_idx').on(t.boardId),
    // Index for fetching tasks by column (critical for your main query)
    index('task_board_column_id_idx').on(t.boardColumnId),
    // Composite index for fetching and sorting tasks by column
    index('task_board_column_id_sort_order_idx').on(
      t.boardColumnId,
      t.sort_order,
    ),
    // Index for fetching tasks by owner
    index('task_owner_idx').on(t.owner),
    // Index for fetching tasks by assignee
    index('task_assignee_idx').on(t.assignee),
    // Index for filtering by priority
    index('task_priority_idx').on(t.priority),
    // Index for filtering/sorting by due date
    index('task_due_date_idx').on(t.due_date),
  ],
)

// Relations
export const boardRelations = relations(board, ({ many, one }) => ({
  columns: many(boardColumn),
  owner: one(user, {
    fields: [board.userId],
    references: [user.id],
  }),
}))

export const boardColumnRelations = relations(boardColumn, ({ many, one }) => ({
  tasks: many(task),
  board: one(board, {
    fields: [boardColumn.boardId],
    references: [board.id],
  }),
}))

export const taskRelations = relations(task, ({ one }) => ({
  column: one(boardColumn, {
    fields: [task.boardColumnId],
    references: [boardColumn.id],
  }),
  board: one(board, {
    fields: [task.boardId],
    references: [board.id],
  }),
  ownerUser: one(user, {
    fields: [task.owner],
    references: [user.id],
  }),
  assigneeUser: one(user, {
    fields: [task.assignee],
    references: [user.id],
  }),
}))
