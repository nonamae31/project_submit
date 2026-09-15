import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const json = (await req.json()) as { prompt?: string };
    const taskId = json.prompt;

    if (!taskId) {
      return NextResponse.json({ error: 'Missing prompt/taskId in request body' }, { status: 400 });
    }

    const dummyText = `Đánh giá AI cho Nhiệm vụ ${taskId}:\n\n- UI/UX Accessibility đã được hỗ trợ đầy đủ (E5).\n- Thiết kế Responsive hoạt động tốt trên thiết bị di động (E1).\n- Streaming UI mượt mà không độ trễ (E3).\n- Hỗ trợ Dark Mode chuẩn xác (E7).\n- Nhìn chung: Đạt chuẩn yêu cầu hệ thống.`;

    const stream = new ReadableStream({
      async start(controller) {
        const words = dummyText.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          controller.enqueue(new TextEncoder().encode(word + (i < words.length - 1 ? ' ' : '')));
          // Simulate streaming delay
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error generating AI evaluation:', error);
    return NextResponse.json({ error: 'Failed to process AI evaluation' }, { status: 500 });
  }
}
