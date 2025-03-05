'use server'; // 标记为Server Action

import { redirect } from 'next/navigation'; // 用于页面重定向
import { createCheckoutSession, createCustomerPortalSession } from './stripe'; // Stripe相关服务
import { withTeam } from '@/lib/auth/middleware'; // 团队验证中间件

// 创建结账会话的Action
export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string; // 获取价格ID
  await createCheckoutSession({ team: team, priceId }); // 创建Stripe结账会话
});

// 创建客户门户会话的Action
export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team); // 创建Stripe客户门户会话
  redirect(portalSession.url); // 重定向到门户URL
});
