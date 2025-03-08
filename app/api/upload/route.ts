import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少 session-id' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'upload', sessionId, 'pdf');

    // 如果目录不存在则创建
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // 处理每个文件
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, Buffer.from(buffer));
    }

    return NextResponse.json({ message: '文件上传成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}