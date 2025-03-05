import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription
} from '@/lib/db/queries';

// 初始化Stripe客户端，使用环境变量中的密钥
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' // 指定Stripe API版本
});

// 创建Stripe结账会话，用于用户订阅
export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  // 如果用户或团队不存在，重定向到注册页面
  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  // 创建新的Stripe结账会话
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // 只接受信用卡支付
    line_items: [
      {
        price: priceId, // 订阅价格ID
        quantity: 1
      }
    ],
    mode: 'subscription', // 设置为订阅模式
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`, // 成功后的回调URL
    cancel_url: `${process.env.BASE_URL}/pricing`, // 取消后的回调URL
    customer: team.stripeCustomerId || undefined, // 关联的Stripe客户ID
    client_reference_id: user.id.toString(), // 关联的用户ID
    allow_promotion_codes: true, // 允许使用优惠码
    subscription_data: {
      trial_period_days: 14 // 14天免费试用期
    }
  });

  // 重定向到Stripe结账页面
  redirect(session.url!);
}

// 创建客户门户会话，用于管理订阅
export async function createCustomerPortalSession(team: Team) {
  // 检查必要的Stripe信息是否存在
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  // 如果已有配置，使用第一个配置
  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    // 否则创建新的门户配置
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        }
      }
    });
  }

  // 创建并返回客户门户会话
  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

// 处理订阅状态变化
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // 根据客户ID获取团队信息
  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  // 根据订阅状态更新团队信息
  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

// 获取所有有效的Stripe价格
export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'], // 扩展包含产品信息
    active: true, // 只获取有效价格
    type: 'recurring' // 只获取定期订阅价格
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

// 获取所有有效的Stripe产品
export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true, // 只获取有效产品
    expand: ['data.default_price'] // 扩展包含默认价格信息
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}
