import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';

// 使用环境变量中的密钥生成加密密钥
const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10; // 密码哈希的盐值轮数

// 哈希密码：将明文密码转换为安全的哈希值
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

// 比较密码：验证输入的密码是否与哈希值匹配
export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// 会话数据类型定义
type SessionData = {
  user: { id: number }; // 用户ID
  expires: string; // 过期时间
};

// 生成JWT token：创建包含用户信息的加密token
export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // 使用HS256算法
    .setIssuedAt() // 设置签发时间
    .setExpirationTime('1 day from now') // 设置1天有效期
    .sign(key); // 使用密钥签名
}

// 验证JWT token：验证并解析token内容
export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'], // 验证使用的算法
  });
  return payload as SessionData;
}

// 获取当前会话：从cookies中获取并验证会话信息
export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

// 设置会话：创建新的会话并存储在cookies中
export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1天后过期
  const session: SessionData = {
    user: { id: user.id! }, // 用户ID
    expires: expiresInOneDay.toISOString(), // 过期时间
  };
  const encryptedSession = await signToken(session); // 生成加密的token
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay, // 设置cookie过期时间
    httpOnly: true, // 防止客户端脚本访问
    secure: true, // 仅通过HTTPS传输
    sameSite: 'lax', // 防止CSRF攻击
  });
}
