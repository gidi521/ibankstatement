import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 卡片组件
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'; // 图标组件
import { ActivityType } from '@/lib/db/schema'; // 活动类型定义
import { getActivityLogs } from '@/lib/db/queries'; // 获取活动日志的查询

// 活动类型与图标的映射
const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

// 获取相对时间
function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now'; // 刚刚
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`; // 几分钟前
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`; // 几小时前
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`; // 几天前
  return date.toLocaleDateString(); // 返回日期
}

// 格式化活动类型为可读字符串
function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up'; // 您已注册
    case ActivityType.SIGN_IN:
      return 'You signed in'; // 您已登录
    case ActivityType.SIGN_OUT:
      return 'You signed out'; // 您已登出
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password'; // 您已更改密码
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account'; // 您已删除账户
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account'; // 您已更新账户
    case ActivityType.CREATE_TEAM:
      return 'You created a new team'; // 您已创建新团队
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member'; // 您已移除团队成员
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member'; // 您已邀请团队成员
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation'; // 您已接受邀请
    default:
      return 'Unknown action occurred'; // 未知操作
  }
}

// 活动日志页面组件
export default async function ActivityPage() {
  const logs = await getActivityLogs(); // 获取活动日志

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log // 活动日志标题
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle> // 最近活动卡片标题
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? ( // 如果有日志
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings; // 获取对应图标
                const formattedAction = formatAction(
                  log.action as ActivityType
                ); // 格式化活动类型

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" /> // 图标
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction} // 活动描述
                        {log.ipAddress && ` from IP ${log.ipAddress}`} // 显示IP地址
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))} // 相对时间
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : ( // 如果没有日志
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" /> // 警告图标
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet // 无活动提示
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they'll appear here. // 提示信息
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
