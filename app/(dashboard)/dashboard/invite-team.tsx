'use client'; // 标记为客户端组件

import { Button } from '@/components/ui/button'; // 按钮组件
import { Input } from '@/components/ui/input'; // 输入框组件
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'; // 卡片组件
import { Loader2, PlusCircle } from 'lucide-react'; // 图标组件
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // 单选按钮组组件
import { Label } from '@/components/ui/label'; // 标签组件
import { use, useActionState } from 'react'; // React hooks
import { inviteTeamMember } from '@/app/(login)/actions'; // 邀请团队成员的操作
import { useUser } from '@/lib/auth'; // 用户认证相关逻辑

// 定义操作状态类型
type ActionState = {
  error?: string; // 错误信息
  success?: string; // 成功信息
};

// 邀请团队成员组件
export function InviteTeamMember() {
  const { userPromise } = useUser(); // 获取用户信息
  const user = use(userPromise); // 使用用户信息
  const isOwner = user?.role === 'owner'; // 检查用户是否为团队所有者
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, { error: '', success: '' }); // 处理邀请团队成员的操作状态

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle> // 卡片标题
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4"> // 表单提交处理
          <div>
            <Label htmlFor="email">Email</Label> // 邮箱输入标签
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!isOwner} // 只有团队所有者可以邀请成员
            />
          </div>
          <div>
            <Label>Role</Label> // 角色选择标签
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner} // 只有团队所有者可以设置角色
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="member" /> // 成员角色选项
                <Label htmlFor="member">Member</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owner" id="owner" /> // 所有者角色选项
                <Label htmlFor="owner">Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && ( // 显示错误信息
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && ( // 显示成功信息
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isInvitePending || !isOwner} // 禁用按钮条件
          >
            {isInvitePending ? ( // 加载状态显示
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && ( // 非团队所有者提示
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
