// src/lib/matcher-utils.ts

export function getValue(row: any, key: string): string {
    if (!row) return "";
    for (const k of Object.keys(row)) {
        if (k.toLowerCase().trim() === key.toLowerCase()) {
            const v = row[k];
            if (v === null || v === undefined) return "";
            return String(v);
        }
    }
    return "";
}

export function calculateCommercialGrade(item: any): { grade: number, label: string } {
    const classification = getValue(item, "Classification").toUpperCase();
    const status = getValue(item, "Status").toUpperCase();
    const demandType = getValue(item, "Demand type").toUpperCase();
    const age = parseInt(getValue(item, "Age")) || 0;

    let classScore = 3;
    if (classification.includes("A-GOLD") || classification === "A") classScore = 5;
    else if (classification.includes("B")) classScore = 4;
    else if (classification.includes("C")) classScore = 3;
    else if (classification.includes("Z-OTHER")) classScore = 2;
    else if (classification.includes("OBSOLETE")) classScore = 1;

    let statusScore = 3;
    if (status.includes("OK") || status.includes("NEW")) statusScore = 5;
    else if (status.includes("EXCESS")) statusScore = 2;
    else if (status.includes("STOCKED OUT")) statusScore = 3;

    let demandScore = 3;
    if (demandType.includes("NO HISTORY")) demandScore = 1;
    else if (demandType.includes("SLOW")) demandScore = 2;
    else if (demandType.includes("SPORADIC") || demandType.includes("SEASONAL")) demandScore = 3;
    else if (demandType.includes("NO TREND") || demandType.includes("FAST")) demandScore = 5;

    let ageScore = 3;
    if (age < 90) ageScore = 5;
    else if (age < 180) ageScore = 4;
    else if (age < 365) ageScore = 3;
    else if (age < 999) ageScore = 2;
    else ageScore = 1;

    const weighted = (classScore * 0.4) + (statusScore * 0.2) + (demandScore * 0.2) + (ageScore * 0.2);
    const grade = Math.round(weighted);

    const labels: any = {
        5: "Prime",
        4: "Good",
        3: "Fair",
        2: "Poor",
        1: "Dead Stock"
    };
    return { grade, label: labels[grade] };
}

// ---------- GRADE LABEL HELPERS ----------
export function commercialGradeLabel(grade: number): string {
    const labels: any = {
        5: "Prime",
        4: "Good",
        3: "Fair",
        2: "Poor",
        1: "Dead Stock"
    };
    return labels[grade] || "Unknown";
}

export function physicalGradeLabel(grade: number): string {
    const labels: any = {
        5: "Near New (100%)",
        4: "Good (90%)",
        3: "Fair (80%)",
        2: "Poor (70%)",
        1: "Scrap / Donate (50%)"
    };
    return labels[grade] || "Unknown";
}

function detectCategory(text: string): string {
    const t = String(text || "").toLowerCase();
    if (t.includes("pump end") || t.includes("pump-end") || t.includes("pumpend")) return "PUMP_END";
    if (t.includes("pump")) return "PUMP";
    if (t.includes("sunverter") || t.includes("sundverter")) return "SUNVERTER";
    if (t.includes("inverter")) return "INVERTER";
    if (t.includes("cable")) return "CABLE";
    if (t.includes("pipe")) return "PIPE";
    if (t.includes("solar module") || t.includes("solar panel") || t.includes("pv module") || t.includes("panel")) return "SOLAR_MODULE";
    return "OTHER";
}

export function classifyAndExtractSpecs(text: string) {
    return { category: detectCategory(text) };
}

const STOP_WORDS = new Set(["the", "and", "for", "with", "or", "at", "in", "of", "on", "to", "by", "as", "is", "c/w", "cw", "std", "complete", "type", "new", "old"]);

function tokenize(text: string): string[] {
    return String(text || "")
        .toLowerCase()
        .split(/\s+/)
        .map(t => t.replace(/^[.,;:!?()\[\]{}"'`]+|[.,;:!?()\[\]{}"'`]+$/g, ""))
        .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function strSim(a: string, b: string): number {
    if (!a || !b) return 0;
    return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function overlapScore(quoteTokens: string[], invTokens: string[]): number {
    if (quoteTokens.length === 0) return 0;
    const invSet = new Set(invTokens);
    let matched = 0;
    for (const qt of quoteTokens) {
        if (invSet.has(qt)) { matched++; continue; }
        for (const it of invTokens) {
            if (strSim(qt, it) >= 0.80) { matched++; break; }
        }
    }
    return matched / quoteTokens.length;
}

export function matchQuoteToInventory(quoteItems: any[], inventoryItems: any[]) {
    const matches: any[] = [];
    if (!Array.isArray(quoteItems) || !Array.isArray(inventoryItems)) return matches;

    const inventoryTokenized = inventoryItems.map(inv => {
        const desc = inv?.description || "";
        return {
            item: inv,
            tokens: tokenize(desc),
            category: detectCategory(desc)
        };
    });

    for (const quoteItem of quoteItems) {
        const quoteText = getValue(quoteItem, "ITEMS").trim();
        if (!quoteText) continue;
        const quoteCategory = detectCategory(quoteText);
        if (quoteCategory === "OTHER") continue;

        const quoteTokens = tokenize(quoteText);
        if (quoteTokens.length === 0) continue;

        let bestMatch: any = null;
        let bestScore = 0;
        let bestType = "";

        for (const invT of inventoryTokenized) {
            const compatible = quoteCategory === invT.category
                || (quoteCategory === "PUMP" && invT.category === "PUMP_END")
                || (quoteCategory === "PUMP_END" && invT.category === "PUMP")
                || (quoteCategory === "SUNVERTER" && invT.category === "INVERTER")
                || (quoteCategory === "INVERTER" && invT.category === "SUNVERTER");
            if (!compatible) continue;

            const score = overlapScore(quoteTokens, invT.tokens);
            let matchType = "";
            if (score >= 0.70) matchType = "exact";
            else if (score >= 0.40) matchType = "fuzzy";
            else continue;

            const weighted = matchType === "exact" ? score + 0.05 : score;
            if (weighted > bestScore) {
                bestScore = weighted;
                bestMatch = invT.item;
                bestType = matchType;
            }
        }

        if (bestMatch) {
            matches.push({
                quoteItem,
                inventoryItem: bestMatch,
                matchType: bestType,
                similarity: Math.round(bestScore * 100),
            });
        }
    }
    return matches;
}

export function calculateShopsoiledPrice(costPrice: number, commercialGrade: number, physicalGrade: number, repairCost: number): number {
    const commMultiplier: any = { 5: 0.80, 4: 0.70, 3: 0.60, 2: 0.50, 1: 0.40 };
    const physMultiplier: any = { 5: 1.00, 4: 0.90, 3: 0.80, 2: 0.70, 1: 0.50 };
    const cm = commMultiplier[commercialGrade] || 0.60;
    const pm = physMultiplier[physicalGrade] || 0.80;
    return Math.round(costPrice * cm * pm + (repairCost || 0));
}