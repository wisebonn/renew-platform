"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { FileSearch, Upload, Cpu, ArrowRight, Layers, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface QuotedItem {
  id: number;
  rawText: string;
  quantity: number;
  segment: string;
  extractedMetrics: {
    powerKw?: number;
    powerHp?: number;
    phase?: string;
    isThreePhase?: boolean;
  };
  matchType: 'Exact' | 'Similar' | 'None';
  confidence: number;
  suggestedSubstitute: string;
  netstockCode: string;
  availableQty: number;
}

export default function QuoteScreeningPortal() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<QuotedItem[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to extract technical engineering parameters using regular expressions
  const extractEngineeringMetrics = (text: string) => {
    const textUpper = text.toUpperCase();
    let powerKw: number | undefined;
    let powerHp: number | undefined;
    let phase = '1PH';

    // 1. Extract Kilowatts (e.g., "9.2KW", "11KW")
    const kwMatch = textUpper.match(/([0-9.]+)\s*KW/);
    if (kwMatch) powerKw = parseFloat(kwMatch[1]);

    // 2. Extract Horsepower (e.g., "38HP", "13HP")
    const hpMatch = textUpper.match(/([0-9.]+)\s*HP/);
    if (hpMatch) powerHp = parseFloat(hpMatch[1]);

    // 3. Extract Electrical Phase Configurations
    if (textUpper.includes('3PH') || textUpper.includes('THREE PHASE') || textUpper.includes('415V')) {
      phase = '3PH';
    }

    return { powerKw, powerHp, phase, isThreePhase: phase === '3PH' };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        
        // Read rows as a raw nested matrix to pull exact columns explicitly
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        // Fetch active warehouse components where quantities are 1 or greater
        const { data: dbInventory, error: dbError } = await supabase
          .from('inventory')
          .select('*')
          .gt('quantity_available', 0);

        if (dbError) throw dbError;

        const extractedItems: QuotedItem[] = [];
        let runningId = 1;

        data.forEach((row: any[]) => {
          if (!row || row.length < 2) return;

          // COLUMN CALIBRATION MAP:
          // Based on your specific D&S Excel layout view:
          // Column index 1 (B) = Quoted Item Description text
          // Column index 2 (C) = Quantity count integer
          const textDescription = row[1] ? String(row[1]).trim() : '';
          const qty = parseInt(row[2]) || 1;
          const textUpper = textDescription.toUpperCase();

          // Skip empty spacing, table layout headings, or generic customer labels
          if (
            !textDescription || 
            textUpper === 'ITEMS' || 
            textUpper === 'DESCRIPTION' ||
            textUpper.includes('CUSTOMER') ||
            textUpper.includes('TOTAL') ||
            textDescription.length < 4
          ) {
            return;
          }

          // Run the browser-based technical parameter extractor
          const metrics = extractEngineeringMetrics(textDescription);

          let segment = 'Accessories';
          let matchType: 'Exact' | 'Similar' | 'None' = 'None';
          let confidence = 0;
          let substitute = 'No functional technical alternative found with On-Hand count >= 1';
          let netstockCode = '---';
          let matchedAvailableQty = 0;

          // Segment classification based on engineering keywords
          if (textUpper.includes('MODULE') || textUpper.includes('SOLAR PANEL') || textUpper.includes('COLLECTOR')) segment = 'Solar Modules';
          else if (textUpper.includes('INVERTER') || textUpper.includes('BATTERY') || textUpper.includes('KWH')) segment = 'Solar Inverters';
          else if (textUpper.includes('PUMP') || textUpper.includes('SUBMERSIBLE')) segment = 'Pumps';
          else if (textUpper.includes('MOTOR') || textUpper.includes('KDI')) segment = 'Motors';

          // 🧠 THE TECHNICAL PERFORMANCE MATCHING ENGINE
          if (dbInventory && dbInventory.length > 0) {
            for (const stockItem of dbInventory) {
              const stockDescUpper = stockItem.description.toUpperCase();
              const stockMetrics = extractEngineeringMetrics(stockItem.description);

              // Tier 1 Validation: Direct text string or code alignment
              if (textUpper.includes(stockItem.netstock_code.toUpperCase()) || textUpper === stockDescUpper) {
                matchType = 'Exact';
                confidence = 100;
                substitute = stockItem.description;
                netstockCode = stockItem.netstock_code;
                matchedAvailableQty = stockItem.quantity_available;
                break;
              }

              // Tier 2 Validation: Cross-Brand Performance Evaluation Board
              // Verify segment alignment first before running performance cross-checks
              const isSameSegment = 
                (segment === 'Pumps' && (stockDescUpper.includes('PUMP') || stockDescUpper.includes('SUBMERSIBLE'))) ||
                (segment === 'Motors' && (stockDescUpper.includes('MOTOR') || stockDescUpper.includes('ENGINE') || stockDescUpper.includes('KOHLER'))) ||
                (segment === 'Solar Modules' && (stockDescUpper.includes('MODULE') || stockDescUpper.includes('SOLAR') || stockDescUpper.includes('COLLECTOR')));

              if (isSameSegment) {
                // A: Cross-checking Pump Performance Metrics (Kilowatt & Electrical Phase Alignment)
                if (metrics.powerKw && stockMetrics.powerKw) {
                  const powerVariance = Math.abs(metrics.powerKw - stockMetrics.powerKw);
                  if (powerVariance <= 1.0 && metrics.phase === stockMetrics.phase) {
                    matchType = 'Similar';
                    confidence = powerVariance === 0 ? 95 : 85;
                    substitute = `${stockItem.description} (Cross-Brand Substitute Option)`;
                    netstockCode = stockItem.netstock_code;
                    matchedAvailableQty = stockItem.quantity_available;
                    if (powerVariance === 0) break; 
                  }
                }

                // B: Cross-checking Heavy Engine/Motor Metrics (Horsepower Performance Alignment)
                if (metrics.powerHp && stockMetrics.powerHp) {
                  const hpVariance = Math.abs(metrics.powerHp - stockMetrics.powerHp);
                  if (hpVariance <= 5.0) { // Tolerances up to 5HP variance for field applications
                    matchType = 'Similar';
                    confidence = hpVariance === 0 ? 95 : 80;
                    substitute = `${stockItem.description} (Performance Equal Option)`;
                    netstockCode = stockItem.netstock_code;
                    matchedAvailableQty = stockItem.quantity_available;
                    if (hpVariance === 0) break;
                  }
                }
              }
            }
          }

          extractedItems.push({
            id: runningId++,
            rawText: textDescription,
            quantity: qty,
            segment,
            extractedMetrics: metrics,
            matchType,
            confidence,
            suggestedSubstitute: substitute,
            netstockCode,
            availableQty: matchedAvailableQty
          });
        });

        setParsedItems(extractedItems);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Error executing matching arrays.');
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
            <FileSearch className="text-teal-400" size={26} /> Portal 2: CSR Performance Database Matcher
          </h2>
          <p className="text-sm text-slate-400 mt-1">Cross-examine equipment parameters (kW, HP, Phases) directly against physical on-hand stocks.</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
            <XCircle size={16} />
            <span><strong>Database Intercept Error:</strong> {errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl h-fit">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Project Identification</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Target Project Name</label>
