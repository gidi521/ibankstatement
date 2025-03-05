import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 用户表：存储系统用户信息
export const users = pgTable('users', {
  id: serial('id').primaryKey(), // 自增主键
  name: varchar('name', { length: 100 }), // 用户姓名
  email: varchar('email', { length: 255 }).notNull().unique(), // 唯一邮箱
  passwordHash: text('password_hash').notNull(), // 密码哈希值
  role: varchar('role', { length: 20 }).notNull().default('member'), // 用户角色
  createdAt: timestamp('created_at').notNull().defaultNow(), // 创建时间
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // 更新时间
  deletedAt: timestamp('deleted_at'), // 软删除时间
});

// 团队表：存储团队信息
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(), // 自增主键
  name: varchar('name', { length: 100 }).notNull(), // 团队名称
  createdAt: timestamp('created_at').notNull().defaultNow(), // 创建时间
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // 更新时间
  stripeCustomerId: text('stripe_customer_id').unique(), // Stripe客户ID
  stripeSubscriptionId: text('stripe_subscription_id').unique(), // Stripe订阅ID
  stripeProductId: text('stripe_product_id'), // Stripe产品ID
  planName: varchar('plan_name', { length: 50 }), // 订阅计划名称
  subscriptionStatus: varchar('subscription_status', { length: 20 }), // 订阅状态
});

// 团队成员表：存储用户与团队的关联关系
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(), // 自增主键
  userId: integer('user_id') // 用户ID
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id') // 团队ID
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(), // 成员角色
  joinedAt: timestamp('joined_at').notNull().defaultNow(), // 加入时间
});

// 活动日志表：记录系统重要操作日志
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(), // 自增主键
  teamId: integer('team_id') // 关联团队ID
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id), // 操作用户ID
  action: text('action').notNull(), // 操作内容
  timestamp: timestamp('timestamp').notNull().defaultNow(), // 操作时间
  ipAddress: varchar('ip_address', { length: 45 }), // 操作IP地址
});

// 邀请表：存储团队邀请信息
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(), // 自增主键
  teamId: integer('team_id') // 关联团队ID
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(), // 被邀请人邮箱
  role: varchar('role', { length: 50 }).notNull(), // 邀请角色
  invitedBy: integer('invited_by') // 邀请人ID
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(), // 邀请时间
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 邀请状态
});

// 定义团队表的关系
export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers), // 一个团队有多个成员
  activityLogs: many(activityLogs), // 一个团队有多个活动日志
  invitations: many(invitations), // 一个团队有多个邀请
}));

// 定义用户表的关系
export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers), // 一个用户可以是多个团队的成员
  invitationsSent: many(invitations), // 一个用户可以发送多个邀请
}));

// 定义邀请表的关系
export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, { // 每个邀请属于一个团队
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, { // 每个邀请由一个用户发起
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

// 定义团队成员表的关系
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, { // 每个成员对应一个用户
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, { // 每个成员属于一个团队
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

// 定义活动日志表的关系
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, { // 每个日志关联一个团队
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, { // 每个日志关联一个用户
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// 定义类型推断
export type User = typeof users.$inferSelect; // 用户查询类型
export type NewUser = typeof users.$inferInsert; // 用户插入类型
export type Team = typeof teams.$inferSelect; // 团队查询类型
export type NewTeam = typeof teams.$inferInsert; // 团队插入类型
export type TeamMember = typeof teamMembers.$inferSelect; // 团队成员查询类型
export type NewTeamMember = typeof teamMembers.$inferInsert; // 团队成员插入类型
export type ActivityLog = typeof activityLogs.$inferSelect; // 活动日志查询类型
export type NewActivityLog = typeof activityLogs.$inferInsert; // 活动日志插入类型
export type Invitation = typeof invitations.$inferSelect; // 邀请查询类型
export type NewInvitation = typeof invitations.$inferInsert; // 邀请插入类型

// 定义包含成员的团队数据类型
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>; // 包含用户基本信息
  })[];
};

// 定义活动类型枚举
export enum ActivityType {
  SIGN_UP = 'SIGN_UP', // 注册
  SIGN_IN = 'SIGN_IN', // 登录
  SIGN_OUT = 'SIGN_OUT', // 登出
  UPDATE_PASSWORD = 'UPDATE_PASSWORD', // 更新密码
  DELETE_ACCOUNT = 'DELETE_ACCOUNT', // 删除账号
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT', // 更新账号
  CREATE_TEAM = 'CREATE_TEAM', // 创建团队
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER', // 移除团队成员
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER', // 邀请团队成员
  ACCEPT_INVITATION = 'ACCEPT_INVITATION', // 接受邀请
}
