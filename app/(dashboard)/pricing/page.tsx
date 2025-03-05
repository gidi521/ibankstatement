import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

// Pricing page component
export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]); // 并行获取价格和产品数据

  const basePlan = products.find((product) => product.name === 'Base'); // 查找基础套餐
  const plusPlan = products.find((product) => product.name === 'Plus'); // 查找高级套餐

  const basePrice = prices.find((price) => price.productId === basePlan?.id); // 查找基础套餐价格
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id); // 查找高级套餐价格

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={basePlan?.name || 'Base'} // 套餐名称
          price={basePrice?.unitAmount || 800} // 套餐价格
          interval={basePrice?.interval || 'month'} // 计费周期
          trialDays={basePrice?.trialPeriodDays || 7} // 试用天数
          features={[
            'Unlimited Usage', // 无限使用
            'Unlimited Workspace Members', // 无限工作区成员
            'Email Support', // 邮件支持
          ]}
          priceId={basePrice?.id} // 价格ID
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'} // 套餐名称
          price={plusPrice?.unitAmount || 1200} // 套餐价格
          interval={plusPrice?.interval || 'month'} // 计费周期
          trialDays={plusPrice?.trialPeriodDays || 7} // 试用天数
          features={[
            'Everything in Base, and:', // 包含基础套餐所有功能
            'Early Access to New Features', // 新功能早期访问
            '24/7 Support + Slack Access', // 24/7支持 + Slack访问
          ]}
          priceId={plusPrice?.id} // 价格ID
        />
      </div>
    </main>
  );
}

// Pricing card component
function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string; // 套餐名称
  price: number; // 套餐价格
  interval: string; // 计费周期
  trialDays: number; // 试用天数
  features: string[]; // 功能列表
  priceId?: string; // 价格ID
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2> // 套餐名称
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial // 试用天数
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '} // 显示价格
        <span className="text-xl font-normal text-gray-600">
          per user / {interval} // 每用户/计费周期
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" /> // 功能图标
            <span className="text-gray-700">{feature}</span> // 功能描述
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} /> // 隐藏的价格ID
        <SubmitButton /> // 提交按钮
      </form>
    </div>
  );
}
