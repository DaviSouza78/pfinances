import { NextResponse } from 'next/server';
import { processSubscriptions } from '@/actions/subscription.actions';

export async function GET(request: Request) {
  // 1. Validar Token (Secret do Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'secret-cron-token';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Executar processo de injeção atômica
  try {
    const result = await processSubscriptions();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
