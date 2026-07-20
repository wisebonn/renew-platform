import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { inventoryData } = await request.json();

    if (!inventoryData || !Array.isArray(inventoryData)) {
      return NextResponse.json({ error: 'Invalid or missing data payload array' }, { status: 400 });
    }

    // 1. Execute the wipe and overwrite safely from our backend server environment
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .neq('branch_location', 'WIPE_ALL');

    if (deleteError) throw deleteError;

    // 2. Batch insert the parsed rows cleanly 
    const { error: insertError } = await supabase
      .from('inventory')
      .insert(inventoryData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: inventoryData.length });
  } catch (error: any) {
    console.error('Server pipeline intercepted: ', error);
    return NextResponse.json({ error: error.message || 'Database connection dropped' }, { status: 500 });
  }
}
