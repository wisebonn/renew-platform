import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { inventoryData } = await request.json();

    if (!inventoryData || !Array.isArray(inventoryData)) {
      return NextResponse.json({ error: 'Missing inventory records payload array' }, { status: 400 });
    }

    // 1. Clean out old entries to avoid data duplication issues
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .neq('branch_location', 'WIPE_ALL');

    if (deleteError) throw deleteError;

    // 2. Batch insert the fresh parsed assets from Netstock
    const { error: insertError } = await supabase
      .from('inventory')
      .insert(inventoryData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: inventoryData.length });
  } catch (error: any) {
    console.error('Database sync error caught: ', error);
    return NextResponse.json({ error: error.message || 'Server processing drop' }, { status: 500 });
  }
}
