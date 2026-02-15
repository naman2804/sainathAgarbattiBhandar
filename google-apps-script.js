// ============================================================
// GOOGLE APPS SCRIPT — Paste this entire code in Apps Script
// ============================================================
// Your Google Sheet should have 3 tabs (sheets):
//   1. "Orders"    — where submitted orders will be saved (leave empty, headers auto-created)
//   2. "Retailers" — Column A filled with all retailer/customer names (one per row)
//   3. "Products"  — Column A filled with all product names (one per row)
// ============================================================

// Handle GET requests — returns retailer & product lists
function doGet(e) {
  var action = e.parameter.action;

  if (action === "getData") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Read retailers from "Retailers" sheet, Column A
    var retailerSheet = ss.getSheetByName("Retailers");
    var retailerData = retailerSheet.getRange("A2:A" + retailerSheet.getLastRow()).getValues();
    var retailers = retailerData.map(function(row) { return row[0]; }).filter(function(v) { return v !== ""; });

    // Read products from "Products" sheet, Column A
    var productSheet = ss.getSheetByName("Products");
    var productData = productSheet.getRange("A2:A" + productSheet.getLastRow()).getValues();
    var products = productData.map(function(row) { return row[0]; }).filter(function(v) { return v !== ""; });

    // Sort alphabetically
    retailers.sort();
    products.sort();

    return ContentService.createTextOutput(JSON.stringify({
      retailers: retailers,
      products: products
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput("OK");
}

// Handle POST requests — saves an order to the "Orders" sheet
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Orders");

  // Auto-create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Time", "Employee", "Retailer", "Product", "Quantity", "Special Price", "Remarks"]);
    // Bold the header row
    sheet.getRange("1:1").setFontWeight("bold");
  }

  var now = new Date();
  var date = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
  var time = Utilities.formatDate(now, Session.getScriptTimeZone(), "hh:mm a");

  sheet.appendRow([
    date,
    time,
    e.parameter.employee,
    e.parameter.retailer,
    e.parameter.product,
    e.parameter.quantity,
    e.parameter.specialPrice || "-",
    e.parameter.remarks || "-"
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
