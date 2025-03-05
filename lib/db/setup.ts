import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

// 命令行提问工具：用于获取用户输入
function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// 检查Stripe CLI是否安装：验证Stripe CLI的安装和认证状态
async function checkStripeCLI() {
  console.log('Step 1: Checking if Stripe CLI is installed and authenticated...');
  try {
    await execAsync('stripe --version');
    console.log('Stripe CLI is installed.');

    // 检查Stripe CLI是否已认证
    try {
      await execAsync('stripe config --list');
      console.log('Stripe CLI is authenticated.');
    } catch (error) {
      console.log('Stripe CLI is not authenticated or the authentication has expired.');
      console.log('Please run: stripe login');
      const answer = await question('Have you completed the authentication? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Please authenticate with Stripe CLI and run this script again.');
        process.exit(1);
      }

      // 用户确认登录后再次验证认证
      try {
        await execAsync('stripe config --list');
        console.log('Stripe CLI authentication confirmed.');
      } catch (error) {
        console.error('Failed to verify Stripe CLI authentication. Please try again.');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Stripe CLI is not installed. Please install it and try again.');
    console.log('To install Stripe CLI, follow these steps:');
    console.log('1. Visit: https://docs.stripe.com/stripe-cli');
    console.log('2. Download and install the Stripe CLI for your operating system');
    console.log('3. After installation, run: stripe login');
    console.log('After installation and authentication, please run this setup script again.');
    process.exit(1);
  }
}

// 获取Postgres连接URL：设置本地或远程Postgres实例
async function getPostgresURL(): Promise<string> {
  console.log('Step 2: Setting up Postgres');
  const dbChoice = await question(
    'Do you want to use a local Postgres instance with Docker (L) or a remote Postgres instance (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    console.log('Setting up local Postgres instance with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  } else {
    console.log('You can find Postgres databases at: https://vercel.com/marketplace?category=databases');
    return await question('Enter your POSTGRES_URL: ');
  }
}

// 设置本地Postgres：使用Docker启动本地Postgres实例
async function setupLocalPostgres() {
  console.log('Checking if Docker is installed...');
  try {
    await execAsync('docker --version');
    console.log('Docker is installed.');
  } catch (error) {
    console.error('Docker is not installed. Please install Docker and try again.');
    console.log('To install Docker, visit: https://docs.docker.com/get-docker/');
    process.exit(1);
  }

  console.log('Creating docker-compose.yml file...');
  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: next_saas_starter_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(path.join(process.cwd(), 'docker-compose.yml'), dockerComposeContent);
  console.log('docker-compose.yml file created.');

  console.log('Starting Docker container with `docker compose up -d`...');
  try {
    await execAsync('docker compose up -d');
    console.log('Docker container started successfully.');
  } catch (error) {
    console.error('Failed to start Docker container. Please check your Docker installation and try again.');
    process.exit(1);
  }
}

// 获取Stripe密钥：从用户输入中获取Stripe Secret Key
async function getStripeSecretKey(): Promise<string> {
  console.log('Step 3: Getting Stripe Secret Key');
  console.log('You can find your Stripe Secret Key at: https://dashboard.stripe.com/test/apikeys');
  return await question('Enter your Stripe Secret Key: ');
}

// 创建Stripe Webhook：使用Stripe CLI创建webhook并获取密钥
async function createStripeWebhook(): Promise<string> {
  console.log('Step 4: Creating Stripe webhook...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Failed to extract Stripe webhook secret');
    }
    console.log('Stripe webhook created.');
    return match[0];
  } catch (error) {
    console.error('Failed to create Stripe webhook. Check your Stripe CLI installation and permissions.');
    if (os.platform() === 'win32') {
      console.log('Note: On Windows, you may need to run this script as an administrator.');
    }
    throw error;
  }
}

// 生成认证密钥：使用crypto生成随机的AUTH_SECRET
function generateAuthSecret(): string {
  console.log('Step 5: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

// 写入环境变量文件：将配置写入.env文件
async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 6: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

// 主设置函数：执行所有设置步骤
async function main() {
  await checkStripeCLI();

  const POSTGRES_URL = await getPostgresURL();
  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
  const BASE_URL = 'http://localhost:3000';
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    POSTGRES_URL,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    BASE_URL,
    AUTH_SECRET,
  });

  console.log('🎉 Setup completed successfully!');
}

// 执行主函数并处理错误
main().catch(console.error);
