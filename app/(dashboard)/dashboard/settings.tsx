'use client'; // 标记为客户端组件

import { Button } from '@/components/ui/button'; // 按钮组件
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // 头像组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 卡片组件
import { customerPortalAction } from '@/lib/payments/actions'; // 管理订阅的操作
import { useActionState } from 'react'; // React hooks
import { TeamDataWithMembers, User } from '@/lib/db/schema'; // 数据库模型
import { removeTeamMember } from '@/app/(login)/actions'; // 移除团队成员的操作
import { InviteTeamMember } from './invite-team'; // 邀请团队成员组件

// 定义操作状态类型
type ActionState = {
  error?: string; // 错误信息
  success?: string; // 成功信息
};

// 团队设置组件
export function Settings({ teamData }: { teamData: TeamDataWithMembers }) {
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, { error: '', success: '' }); // 处理移除团队成员的操作状态

  // 获取用户显示名称
  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User'; // 优先使用用户名，其次使用邮箱
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Team Settings</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Subscription</CardTitle> // 团队订阅信息
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <p className="font-medium">
                  Current Plan: {teamData.planName || 'Free'} // 当前订阅计划
                </p>
                <p className="text-sm text-muted-foreground">
                  {teamData.subscriptionStatus === 'active'
                    ? 'Billed monthly' // 按月计费
                    : teamData.subscriptionStatus === 'trialing'
                      ? 'Trial period' // 试用期
                      : 'No active subscription'} // 无有效订阅
                </p>
              </div>
              <form action={customerPortalAction}>
                <Button type="submit" variant="outline">
                  Manage Subscription // 管理订阅按钮
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members</CardTitle> // 团队成员列表
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {teamData.teamMembers.map((member, index) => (
              <li key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage
                      src={`/placeholder.svg?height=32&width=32`}
                      alt={getUserDisplayName(member.user)} // 用户头像
                    />
                    <AvatarFallback>
                      {getUserDisplayName(member.user)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')} // 头像备用显示名称首字母
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getUserDisplayName(member.user)} // 用户显示名称
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role} // 用户角色
                    </p>
                  </div>
                </div>
                {index > 1 ? ( // 前两个成员不可移除
                  <form action={removeAction}>
                    <input type="hidden" name="memberId" value={member.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isRemovePending} // 禁用按钮条件
                    >
                      {isRemovePending ? 'Removing...' : 'Remove'} // 移除按钮
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
          {removeState?.error && ( // 显示错误信息
            <p className="text-red-500 mt-4">{removeState.error}</p>
          )}
        </CardContent>
      </Card>
      <InviteTeamMember /> // 邀请团队成员组件
    </section>
  );
}
