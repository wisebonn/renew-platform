import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { inventoryData } = await request.json();

    if (!inventoryData || !Array.isArray(inventoryData)) {
      return NextResponse.json({ error: 'Data payload array is empty' }, { status: 400 });
    }

    // Clear old week stock rows safely from the cloud database
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .neq('branch_location', 'WIPE_ALL');

    if (deleteError) throw deleteError;

    // Insert the fresh parsed data objects
    const { error: insertError } = await supabase
      .from('inventory')
      .insert(inventoryData);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: inventoryData.length });
  } catch (error: any) {
    console.error('Server pipeline caught error: ', error);
    return NextResponse.json({ error: error.message || 'Database write failure' }, { status: 500 });
  }
}
