"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSearch, Upload, Cpu, ArrowRight, Layers, FileSpreadsheet } from 'lucide-react';

interface QuotedItem {
  id: number;
  rawText: string;
  quantity: number;
  segment: string;
  brand: string;
  rating: string;
  matchType: 'Exact' | 'Similar' | 'None';
  confidence: number;
  suggestedSubstitute: string;
  netstockCode: string;
}

export default function QuoteScreeningPortal() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<QuotedItem[]>([]);
  const [projectName, setProjectName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        const extractedItems: QuotedItem[] = [];
        let runningId = 1;

        data.forEach((row: any) => {
          if (!row || row.length === 0) return;
          const textDescription = String(row[0] || '').trim();
          const qty = parseInt(row[1]) || 1;

          if (!textDescription || textDescription.toLowerCase().includes('item') || textDescription.toLowerCase().includes('total')) {
            return;
          }

          let segment = 'Accessories';
          let rating = 'N/A';
          let matchType: 'Exact' | 'Similar' | 'None' = 'None';
          let confidence = 0;
          let substitute = 'No match found in stock';
          let netstockCode = '---';

          const textUpper = textDescription.toUpperCase();

          if (textUpper.includes('MODULE') || textUpper.includes('SOLAR PANEL')) {
            segment = 'Solar Modules';
            rating = textUpper.includes('350W') ? '350W' : 'Generic';
            if (textUpper.includes('350W')) { 
              matchType = 'Exact'; 
              confidence = 100; 
              substitute = 'Dayliff 350W 24VDC Crystalline Module'; 
              netstockCode = 'SLM-DL-350W'; 
            }
          } else if (textUpper.includes('SUNVERTER') || textUpper.includes('INVERTER')) {
            segment = 'Solar Inverters';
            rating = textUpper.includes('7KW') ? '7kW' : textUpper.includes('5KW') ? '5kW' : 'Generic';
            if (textUpper.includes('7KW')) { 
              matchType = 'Exact'; 
              confidence = 98; 
              substitute = 'Dayliff Sunverter B.3 7kW Solar Inverter'; 
              netstockCode = 'INV-DL-SV7'; 
            } else { 
              matchType = 'Similar'; 
              confidence = 74; 
              substitute = 'Dayliff Sunverter B.3 7.5kW (Engineering Check)'; 
              netstockCode = 'INV-DL-SV7.5'; 
            }
          } else if (textUpper.includes('PUMP') || textUpper.includes('DAYLIFF DS')) {
            segment = 'Pumps'; 
            matchType = 'Similar'; 
            confidence = 88; 
            substitute = 'Dayliff DS 3-15 Submersible (Matches Duty Point)'; 
            netstockCode = 'PMP-DL-DS315'; 
            rating = 'Duty Point Met';
          } else if (textUpper.includes('CABLE') || textUpper.includes('WIRE')) {
            segment = 'Accessories'; 
            rating = '4mm 4-Core'; 
            matchType = 'Exact'; 
            confidence = 100; 
            substitute = '4mm 4-Core Copper Underground Cable'; 
            netstockCode = 'CAB-UG-4MM';
          }

          extractedItems.push({ id: runningId++, rawText: textDescription, quantity: qty, segment, brand: 'Dayliff', rating, matchType, confidence, suggestedSubstitute: substitute, netstockCode });
        });
        setParsedItems(extractedItems);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsProcessing(false); 
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <main className="flex-1 p-8 w-full h-full overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSearch className="text-teal-400" size={26} /> Portal 2: CSR Quote Screening Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">Drop an engineering quote spreadsheet to parse component descriptions and run real-time matching checks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl h-fit">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Project Identification</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Target Project Name</label>
              <input type="text" placeholder="e.g., ChildFund Narok Borehole" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg p-2.5 text-sm text-white focus:outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Upload Quotation Spreadsheet</label>
              <label className="border border-dashed border-slate-800 bg-slate-950/60 hover:bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                <Upload size={24} className="text-slate-500 mb-2" />
                <span className="text-xs font-bold text-slate-300">Choose Excel Quote File</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {fileName && ( <div className="flex items-center space-x-2 text-teal-400 bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-lg text-xs"><FileSpreadsheet size={16} /><span className="truncate font-semibold">{fileName}</span></div> )}
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col min-h-[400px]">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2"><Cpu size={16} className="text-teal-400" /> Product Intelligence Parser Output</h3>
            {isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div><p className="text-xs font-medium">Running Matching Engine matrices...</p></div>
            ) : parsedItems.length > 0 ? (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                      <th className="p-3">Quoted Item Description</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-center">Match Status</th>
                      <th className="p-3">Suggested Stock Substitute</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-slate-200 max-w-xs truncate">{item.rawText}</td>
                        <td className="p-3 text-slate-400"><span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium border border-slate-700/60 text-slate-300">{item.segment}</span></td>
                        <td className="p-3 text-center text-slate-300 font-semibold">{item.quantity}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold uppercase tracking-wider text-[10px]">
                            {item.matchType} ({item.confidence}%)
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="truncate max-w-xs block">{item.suggestedSubstitute}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 flex justify-end"><button type="button" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg transition-all">Commit to Technical Hold Queue <ArrowRight size={14} /></button></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <Layers size={32} className="text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-400">Waiting for Quote Document</p>
                <p className="text-[10px] text-slate-600 max-w-xs mt-0.5">Please specify a project identity title and select an engineering quotation excel worksheet above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
