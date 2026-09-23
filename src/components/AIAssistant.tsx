"use client";
import { useState } from "react";

type Msg = { role: "user" | "ai"; text: string };

const KB: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["upload", "inventory", "netstock", "excel"],
    answer: "To upload inventory:\n1. Go to Inventory Upload\n2. Either upload an Excel file manually, OR use the Netstock Sync tab\n3. Items get auto-graded N1-N5 by commercial value\n4. Click any category card to see items and quantities."
  },
  {
    keywords: ["quote", "screen", "match", "screening"],
    answer: "To screen a quote:\n1. Go to Quote Screening\n2. Upload the Excel quote\n3. Click 'Analyze & Save Quote'\n4. Review matches with grades and estimated prices\n5. Click Reserve or Decline on each item."
  },
  {
    keywords: ["reserve", "reservation", "quantity"],
    answer: "Reserving items:\n1. On Quote Screening, click Reserve\n2. Enter quantity when prompted\n3. Items appear in Reservation Engine\n4. Reserved items stay for 30 days before expiring.\n\nReservations track the customer automatically."
  },
  {
    keywords: ["test", "repair", "workshop", "grade", "physical"],
    answer: "Testing & Repair:\n1. Go to Testing & Repair\n2. Enter password (admin2024 or workshop2024)\n3. Two tabs: Manual Report and Business Central\n4. Fill fault type, physical grade (P1-P5), repair cost\n5. Submit → shopsoiled price calculated automatically."
  },
  {
    keywords: ["business central", "bc", "book", "work order"],
    answer: "Business Central booking:\n1. Go to Testing & Repair → BC tab\n2. Click 'Book on BC' next to an item\n3. BC returns a Work Order ID\n4. Track the ID and BC status on this platform.\n\nBC credentials go in .env.local once available."
  },
  {
    keywords: ["deploy", "csr", "location", "map"],
    answer: "Deployment & Map:\n1. In Reservation Engine, click Deploy\n2. Enter the location\n3. Item moves to CSR Workflow\n4. See it live on the map — hover pin for details."
  },
  {
    keywords: ["savings", "calculate", "retail", "price"],
    answer: "Savings calculation:\n1. Items must be assessed first\n2. Go to Analytics\n3. Select an assessed item\n4. Everything auto-fills EXCEPT the new price\n5. Enter the price of ONE new item\n6. Click Calculate — savings auto-computes\n\nFormula: (New Price - Shopsoiled Price) × Quantity"
  },
  {
    keywords: ["analytics", "chart", "graph", "report"],
    answer: "Analytics shows:\n• Workshop Flow (faults, seasons)\n• Savings Calculator\n• Potential savings per item\n• Charts by fault type, season, customer"
  },
  {
    keywords: ["workshop log", "logs", "history"],
    answer: "Workshop Log lists every repair ever recorded — with item, fault, season, physical grade, and repair cost. Access from the left sidebar."
  },
  {
    keywords: ["grade", "grading", "n1", "n5", "p1", "p5"],
    answer: "Two grading systems:\n• Commercial (N1-N5) — auto-calculated from Netstock data\n• Physical (P1-P5) — assigned by workshop\n\nFinal price = Cost × Commercial% × Physical% + Repair Cost."
  },
  {
    keywords: ["password", "access", "login", "admin", "workshop"],
    answer: "Workshop passwords:\n• Super Admin: admin2024\n• Workshop Tech: workshop2024\n\nChange them in src/app/test-and-repair/page.tsx."
  },
  {
    keywords: ["help", "what can you do", "guide"],
    answer: "I can help with:\n• Uploading inventory\n• Screening quotes\n• Reservations\n• Testing & Repair\n• Business Central\n• Deployment & Map\n• Savings calculation\n• Reports and grades\n\nJust ask!"
  },
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi! I'm ReNew Helper. Ask me anything about the platform — how to upload, screen, reserve, test, or deploy." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const userMsg: Msg = { role: "user", text: q };
    let answer = "I'm not sure about that. Try asking about: upload, quote, reserve, test, deploy, business central, savings, workshop log, grades, or passwords.";
    for (const item of KB) {
      if (item.keywords.some(k => lower.includes(k))) { answer = item.answer; break; }
    }
    setMessages(prev => [...prev, userMsg, { role: "ai", text: answer }]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50"
        title="ReNew Helper"
      >
        {open ? "×" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h3 className="font-bold">ReNew Helper</h3>
            <p className="text-xs opacity-90">AI navigation & troubleshooting</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
            />
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 rounded-lg text-sm">Send</button>
          </div>
        </div>
      )}
    </>
  );
}