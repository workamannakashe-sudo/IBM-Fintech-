// FinWise CSV Statement Parsing Service (csvParser.ts)
import Papa from "papaparse";

export interface CSVTransactionInput {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

/**
 * Parses a raw bank statement CSV file or string and extracts transaction objects.
 * Guarantees clean input validation and fields matching.
 */
export function parseBankCSV(fileContent: string): Promise<CSVTransactionInput[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as any[];
          const transactions: CSVTransactionInput[] = [];

          for (const row of rawData) {
            // Find key fields, supporting various common bank headers (case-insensitive)
            let dateVal = "";
            let descVal = "";
            let amtVal = 0;
            let catVal = "";

            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase().trim();
              const val = String(row[key] || "").trim();

              if (lowerKey.includes("date")) {
                dateVal = val;
              } else if (lowerKey.includes("desc") || lowerKey.includes("memo") || lowerKey.includes("payee") || lowerKey.includes("trans")) {
                // Strip HTML tags for security
                descVal = val.replace(/<\/?[^>]+(>|$)/g, "");
              } else if (lowerKey.includes("amt") || lowerKey.includes("amount") || lowerKey.includes("value") || lowerKey.includes("price")) {
                // Parse float and clean currency symbols
                const cleaned = val.replace(/[$,₹]/g, "").replace(/\s/g, "");
                amtVal = parseFloat(cleaned);
              } else if (lowerKey.includes("cat") || lowerKey.includes("type")) {
                catVal = val;
              }
            }

            // Fallback column checking by indexing if header-matching failed
            if (!dateVal || !descVal || isNaN(amtVal)) {
              const keys = Object.keys(row);
              if (keys.length >= 3) {
                dateVal = dateVal || String(row[keys[0]] || "").trim();
                descVal = descVal || String(row[keys[1]] || "").trim().replace(/<\/?[^>]+(>|$)/g, "");
                const cleaned = String(row[keys[2]] || "").replace(/[$,₹]/g, "").replace(/\s/g, "");
                amtVal = isNaN(amtVal) ? parseFloat(cleaned) : amtVal;
              }
            }

            // Format date safely
            if (!dateVal) {
              const today = new Date();
              dateVal = today.toISOString().split("T")[0];
            }

            // Only push if we successfully parsed a description and a valid numeric amount
            if (descVal && !isNaN(amtVal)) {
              transactions.push({
                date: dateVal,
                description: descVal,
                amount: Math.abs(amtVal), // We store expense values as positive numbers, context controls sign
                category: catVal || undefined,
              });
            }
          }

          resolve(transactions);
        } catch (err) {
          reject(new Error("Failed to map CSV fields: " + (err as Error).message));
        }
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
}
