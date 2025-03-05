'use client'; // 标记为客户端组件

import { Button } from '@/components/ui/button'; // 按钮组件
import { Input } from '@/components/ui/input'; // 输入框组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 卡片组件
import { Label } from '@/components/ui/label'; // 标签组件
import { Lock, Trash2, Loader2 } from 'lucide-react'; // 图标组件
import { startTransition, useActionState } from 'react'; // React hooks
import { updatePassword, deleteAccount } from '@/app/(login)/actions'; // 更新密码和删除账户的操作

// 定义操作状态类型
type ActionState = {
  error?: string; // 错误信息
  success?: string; // 成功信息
};

// 安全设置页面组件
export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    ActionState,
    FormData
  >(updatePassword, { error: '', success: '' }); // 处理更新密码的操作状态

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    ActionState,
    FormData
  >(deleteAccount, { error: '', success: '' }); // 处理删除账户的操作状态

  // 处理密码更新表单提交
  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTransition.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget)); // 使用startTransition包裹操作
    });
  };

  // 处理账户删除表单提交
  const handleDeleteSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      deleteAction(new FormData(event.currentTarget)); // 使用startTransition包裹操作
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Security Settings // 页面标题
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle> // 密码设置卡片标题
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor="current-password">Current Password</Label> // 当前密码输入标签
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label> // 新密码输入标签
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label> // 确认新密码输入标签
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {passwordState.error && ( // 显示错误信息
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && ( // 显示成功信息
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending} // 禁用按钮条件
            >
              {isPasswordPending ? ( // 加载状态显示
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle> // 删除账户卡片标题
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Account deletion is non-reversable. Please proceed with caution. // 删除账户警告信息
          </p>
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <div>
              <Label htmlFor="delete-password">Confirm Password</Label> // 确认密码输入标签
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {deleteState.error && ( // 显示错误信息
              <p className="text-red-500 text-sm">{deleteState.error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending} // 禁用按钮条件
            >
              {isDeletePending ? ( // 加载状态显示
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
