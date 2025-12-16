import { Trade } from '../types';

export const parseCSV = (csvText: string, accountId: string): Trade[] => {
    const lines = csvText.trim().split('\n');
    const trades: Trade[] = [];
    
    // Expected Header:
    // Ticket ID,Open Time,Open Price,Close Time,Close Price,Profit,Lots,Commission,Swap,Symbol,Type,SL,TP,Pips,Reason,Volume
    
    // Skip Header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSVs that might represent basic array or complex quotes (simple split for now based on sample)
        const cols = line.split(',');
        
        // Validation: Ensure enough columns exist
        if (cols.length < 10) continue;

        try {
            const ticketId = cols[0].trim();
            // Convert "2025.12.15 15:57:53" -> "2025-12-15T15:57:53" (ISO Standard)
            const openTimeStr = cols[1].trim().replace(/\./g, '-').replace(' ', 'T');
            const openPrice = parseFloat(cols[2]);
            const closeTimeStr = cols[3]?.trim().replace(/\./g, '-').replace(' ', 'T');
            const closePrice = parseFloat(cols[4]);
            
            // Financials
            const grossProfit = parseFloat(cols[5]) || 0;
            const lots = parseFloat(cols[6]) || 0;
            const commission = parseFloat(cols[7]) || 0;
            const swap = parseFloat(cols[8]) || 0;
            const netPnl = grossProfit + commission + swap;

            const symbol = cols[9].trim().toUpperCase();
            const typeStr = cols[10].trim().toLowerCase();
            const direction = typeStr.includes('buy') ? 'LONG' : 'SHORT';
            
            // Risk params
            const sl = parseFloat(cols[11]) || 0;
            const tp = parseFloat(cols[12]) || 0;

            // Dates
            const entryDate = new Date(openTimeStr).toISOString();
            const exitDate = (closeTimeStr && closeTimeStr !== '1970-01-01T00:00:00') 
                ? new Date(closeTimeStr).toISOString() 
                : undefined;
            
            const status = exitDate ? 'CLOSED' : 'OPEN';
            
            // Optional Reason/Notes
            const reason = cols[14] ? `Imported: ${cols[14]}` : 'Imported via CSV';

            const trade: Trade = {
                id: ticketId,
                accountId: accountId,
                symbol: symbol,
                direction: direction,
                entryDate: entryDate,
                exitDate: exitDate,
                entryPrice: openPrice,
                exitPrice: closePrice,
                quantity: lots,
                pnl: netPnl,
                fees: commission + swap,
                sl: sl,
                tp: tp,
                status: status,
                notes: reason
            };
            
            trades.push(trade);

        } catch (err) {
            console.warn(`Failed to parse CSV line ${i}:`, line, err);
            continue;
        }
    }
    
    return trades;
};
