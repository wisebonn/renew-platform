// src/lib/matcher-utils.ts

// Helper to get ANY column value regardless of casing or spaces (e.g., "ITEMS", "Items", "items ")
export function getValue(row: any, key: string) {
    if (!row) return "";
    for (const k of Object.keys(row)) {
        if (k.toLowerCase().trim() === key.toLowerCase()) {
            return row[k];
        }
    }
    return "";
}

// Actual Category Classifier for the Inventory Upload
export function classifyAndExtractSpecs(text: string) {
    const t = String(text || "").toLowerCase();
    let category = "OTHER";

    // Must check "pump end" before "pump"!
    if (t.includes("pump end")) category = "PUMP_END";
    else if (t.includes("pump")) category = "PUMP";
    else if (t.includes("sunverter")) category = "SUNVERTER";
    else if (t.includes("inverter")) category = "INVERTER";
    else if (t.includes("cable")) category = "CABLE";
    else if (t.includes("pipe")) category = "PIPE";
    else if (t.includes("solar module")) category = "SOLAR_MODULE";

    return { category };
}

function extractSpecNumber(text: string): number | null {
    const match = text.match(/(\d+(\.\d+)?)\s*(kw|mm|kva|watt)/i);
    return match ? parseFloat(match[1]) : null;
}

export function matchQuoteToInventory(quoteItems: any[], inventoryItems: any[]) {
    const matches = [];

    for (const quoteItem of quoteItems) {
        // Get the ITEMS column (Column B) from Quote
        const quoteText = getValue(quoteItem, "ITEMS").toLowerCase().trim();
        
        for (const invItem of inventoryItems) {
            // Get the Description column (Column B) from Inventory
            const invText = getValue(invItem, "Description").toLowerCase().trim();

            let isMatch = false;
            let matchType = "exact";

            // 1. Exact Match (Normalized)
            if (quoteText === invText) {
                isMatch = true;
            } 
            // 2. Fuzzy Match for Pump Ends, C/W Motor, Sunverter (KW variance of 1)
            else if (
                quoteText.includes("pump end") || 
                quoteText.includes("sunverter") || 
                quoteText.includes("c/w motor")
            ) {
                const quoteSpec = extractSpecNumber(quoteText);
                const invSpec = extractSpecNumber(invText);

                if (quoteSpec && invSpec && Math.abs(quoteSpec - invSpec) <= 1) {
                    isMatch = true;
                    matchType = "fuzzy";
                }
            }

            if (isMatch) {
                matches.push({
                    quoteItem,
                    inventoryItem: invItem,
                    matchType
                });
                break; // Found a match, move to next quote item
            }
        }
    }
    
    return matches;
}