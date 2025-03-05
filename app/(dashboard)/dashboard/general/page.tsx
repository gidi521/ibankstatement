'use client'; // 标记为客户端组件

import { startTransition, use, useActionState } from 'react'; // React hooks
import { Button } from '@/components/ui/button'; // 按钮组件
import { Input } from '@/components/ui/input'; // 输入框组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 卡片组件
import { Label } from '@/components/ui/label'; // 标签组件
import { Loader2 } from 'lucide-react'; // 加载图标
import { useUser } from '@/lib/auth'; // 用户认证相关逻辑
import { updateAccount } from '@/app/(login)/actions'; // 更新账户信息的操作

// 定义操作状态类型
type ActionState = {
  error?: string; // 错误信息
  success?: string; // 成功信息
};

// 通用设置页面组件
export default function GeneralPage() {
  const { userPromise } = useUser(); // 获取用户信息
  const user = use(userPromise); // 使用用户信息
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    { error: '', success: '' }
  ); // 处理更新账户信息的操作状态

  // 处理表单提交
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTransition.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      formAction(new FormData(event.currentTarget)); // 使用startTransition包裹操作
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        General Settings // 页面标题
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle> // 账户信息卡片标题
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Name</Label> // 姓名输入标签
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                defaultValue={user?.name || ''} // 默认值为用户姓名
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label> // 邮箱输入标签
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={user?.email || ''} // 默认值为用户邮箱
                required
              />
            </div>
            {state.error && ( // 显示错误信息
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && ( // 显示成功信息
              <p className="text-green-500 text-sm">{state.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending} // 禁用按钮条件
            >
              {isPending ? ( // 加载状态显示
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes' // 保存更改按钮
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
