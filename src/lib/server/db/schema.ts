import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'
import { PRIORITY_VALUES } from '../../zod-schemas'

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

// Moved above session so it can be referenced by session.activeOrganizationId FK
export const organization = sqliteTable(
  'organization',
  {
    id: text('id').primaryKey().$defaultFn(nanoid),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    metadata: text('metadata'),
  },
  t => [
    // For searching/filtering organizations by name and recency
    index('organization_name_idx').on(t.name),
    index('organization_created_at_idx').on(t.createdAt),
  ],
)
export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('active_organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
  },
  t => [
    index('session_user_id_idx').on(t.userId),
    index('session_active_organization_id_idx').on(t.activeOrganizationId),
  ],
)

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

export const member = sqliteTable(
  'member',
  {
    id: text('id').primaryKey().$defaultFn(nanoid),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  t => [
    // Fast lookups by org/user and de-duplication across the join
    index('member_organization_id_idx').on(t.organizationId),
    index('member_user_id_idx').on(t.userId),
    index('member_role_idx').on(t.role),
    unique('member_org_user_unique').on(t.organizationId, t.userId),
  ],
)

export const invitation = sqliteTable(
  'invitation',
  {
    id: text('id').primaryKey().$defaultFn(nanoid),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').default('member').notNull(),
    status: text('status').default('pending').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  t => [
    // Common queries: list invitations by org and status, lookup by email
    index('invitation_email_idx').on(t.email),
    index('invitation_org_id_status_idx').on(t.organizationId, t.status),
    index('invitation_expires_at_idx').on(t.expiresAt),
    unique('invitation_org_email_status_unique').on(t.organizationId, t.email, t.status),
  ],
)

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

    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

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
    // Index for filtering boards by organization
    index('board_organization_id_idx').on(t.organizationId),
    // Composite index for filtering non-deleted boards by user
    index('board_user_id_is_deleted_idx').on(t.userId, t.isDeleted),
    // Composite index for user + organization + deleted flag
    index('board_user_org_is_deleted_idx').on(t.userId, t.organizationId, t.isDeleted),
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
  organization: one(organization, {
    fields: [board.organizationId],
    references: [organization.id],
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

// Organization plugin relations
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  boards: many(board),
}))

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))

// Reverse relations on user for organization plugin
export const userRelations = relations(user, ({ many }) => ({
  // All membership rows for this user (join table: member)
  memberships: many(member),
  // All invitations this user has sent
  invitationsSent: many(invitation),
}))

// Session relations for active organization linkage
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  activeOrganization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
}))
