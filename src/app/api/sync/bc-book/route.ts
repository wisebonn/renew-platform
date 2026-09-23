import { NextResponse } from 'next/server';

// Business Central credentials (paste in .env.local when ready)
const BC_API_URL = process.env.BC_API_URL || "";
const BC_API_KEY = process.env.BC_API_KEY || "";

export async function POST(request: Request) {
  try {
    const { item } = await request.json();

    // Simulated mode if credentials not configured yet
    if (!BC_API_URL || !BC_API_KEY) {
      const fakeId = "WO-" + Date.now().toString().slice(-8);
      return NextResponse.json({
        success: true,
        bc_work_order_id: fakeId,
        bc_status: "Pending (Simulated — add BC_API_URL and BC_API_KEY to go live)",
        bc_report_url: "",
        simulated: true,
      });
    }

    // REAL BC call (uncomment when you have credentials)
    /*
    const res = await fetch(`${BC_API_URL}/workOrders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: item.description,
        customer: item.customer,
        faultType: item.fault_type,
        repairCost: item.repair_cost,
        rating: item.physical_grade,
      }),
    });
    const bcData = await res.json();
    return NextResponse.json({
      success: true,
      bc_work_order_id: bcData.id,
      bc_status: bcData.status,
      bc_report_url: bcData.reportUrl,
      simulated: false,
    });
    */

    return NextResponse.json({ success: false, message: "BC integration not configured" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}