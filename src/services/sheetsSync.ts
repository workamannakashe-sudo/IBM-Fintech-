// FinWise Google Sheets & Google Drive Sync Service (sheetsSync.ts)

// Reusable Google Apps Script Code Template
export const APPS_SCRIPT_TEMPLATE = `
/**
 * FinWise Google Sheets & Google Drive Sync Handler
 * 
 * Instructions:
 * 1. Open Google Sheets, click "Extensions" -> "Apps Script"
 * 2. Paste this code and save.
 * 3. Click "Deploy" -> "New Deployment"
 * 4. Choose "Web App", set "Execute as: Me", and "Who has access: Anyone"
 * 5. Deploy, copy the Web App URL, and paste it in the FinWise profile settings!
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var transactions = [];
  
  // Skip header row
  for (var i = 1; i < rows.length; i++) {
    transactions.push({
      date: rows[i][0],
      description: rows[i][1],
      category: rows[i][2],
      amount: Number(rows[i][3]),
      isAnomaly: Boolean(rows[i][4])
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", transactions: transactions }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Action 1: Synchronize transactions to sheet
    if (data.action === "sync_transactions") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.clear();
      
      // Set Header
      sheet.appendRow(["Date", "Description", "Category", "Amount", "Is Anomaly"]);
      
      // Append Data
      data.transactions.forEach(function(tx) {
        sheet.appendRow([tx.date, tx.description, tx.category, tx.amount, tx.isAnomaly]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        count: data.transactions.length 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action 2: Save PDF Statement report to Google Drive
    if (data.action === "upload_pdf") {
      var folderName = "FinWise Statements";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      var bytes = Utilities.base64Decode(data.base64);
      var blob = Utilities.newBlob(bytes, "application/pdf", data.fileName);
      folder.createFile(blob);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        path: folderName + "/" + data.fileName 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown Action" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Synchronizes local transaction list to Google Sheets.
 */
export async function syncTransactionsToGoogleSheets(
  syncUrl: string,
  transactions: any[]
): Promise<boolean> {
  if (!syncUrl || syncUrl.trim() === "") return false;

  try {
    await fetch(syncUrl, {
      method: "POST",
      mode: "no-cors", // Required in Apps Script unless custom CORS headers are set, no-cors will execute POST fine
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sync_transactions",
        transactions: transactions.map(t => ({
          date: t.date,
          description: t.description,
          category: t.category,
          amount: t.amount,
          isAnomaly: t.isAnomaly
        })),
      }),
    });

    // In no-cors mode, we won't get readable response statuses, but a clean execute is treated as success
    return true;
  } catch (error) {
    console.warn("Failed to sync to Google Sheets, falling back to local cache:", error);
    return false;
  }
}

/**
 * Uploads a generated monthly statement PDF to Google Drive.
 */
export async function uploadPdfToGoogleDrive(
  syncUrl: string,
  base64Pdf: string,
  fileName: string
): Promise<boolean> {
  if (!syncUrl || syncUrl.trim() === "") return false;

  try {
    await fetch(syncUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "upload_pdf",
        base64: base64Pdf,
        fileName: fileName,
      }),
    });
    return true;
  } catch (error) {
    console.warn("Failed to save statement to Google Drive folder:", error);
    return false;
  }
}
