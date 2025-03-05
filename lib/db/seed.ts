import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

// 创建Stripe产品：初始化系统所需的订阅产品
async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  // 创建基础订阅产品
  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  // 为基础产品创建价格
  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month', // 按月订阅
      trial_period_days: 7, // 7天免费试用
    },
  });

  // 创建高级订阅产品
  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  // 为高级产品创建价格
  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month', // 按月订阅
      trial_period_days: 7, // 7天免费试用
    },
  });

  console.log('Stripe products and prices created successfully.');
}

// 主种子函数：初始化数据库数据
async function seed() {
  // 初始化测试用户
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password); // 哈希密码

  // 插入用户数据
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner", // 设置为所有者角色
      },
    ])
    .returning();

  console.log('Initial user created.');

  // 插入团队数据
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team', // 测试团队名称
    })
    .returning();

  // 关联用户和团队
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner', // 设置为团队所有者
  });

  // 创建Stripe产品
  await createStripeProducts();
}

// 执行种子函数
seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1); // 失败时退出并返回错误代码
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0); // 成功时正常退出
  });
