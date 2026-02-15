// ============================================================
// GOOGLE APPS SCRIPT — Paste this entire code in Apps Script
// ============================================================
// Your Google Sheet should have 3 tabs (sheets):
//   1. "Orders"    — where submitted orders will be saved (leave empty, headers auto-created)
//   2. "Retailers" — Columns: A=Name, B=Address, C=Address2, D=MobileNo
//   3. "Products"  — Column A filled with all product names (one per row)
// ============================================================

// Handle GET requests — returns retailer & product lists
function doGet(e) {
  var action = e.parameter.action;

  if (action === "getData") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Read retailers from "Retailers" sheet — Columns A, B, C, D
    var retailerSheet = ss.getSheetByName("Retailers");
    var retailerData = retailerSheet.getRange("A2:D" + retailerSheet.getLastRow()).getValues();
    var retailers = retailerData
      .filter(function(row) { return row[0] !== ""; })
      .map(function(row) {
        return {
          name: row[0],
          address: row[1] || "",
          address2: row[2] || "",
          mobile: row[3] || ""
        };
      });

    // Sort by name
    retailers.sort(function(a, b) { return a.name.localeCompare(b.name); });

    // Read products from "Products" sheet, Column A
    var productSheet = ss.getSheetByName("Products");
    var productData = productSheet.getRange("A2:A" + productSheet.getLastRow()).getValues();
    var products = productData.map(function(row) { return row[0]; }).filter(function(v) { return v !== ""; });

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
    sheet.appendRow(["Date", "Time", "Employee", "Retailer", "Address", "Address2", "Mobile No", "Product", "Quantity", "Special Price", "Remarks"]);
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
    e.parameter.address || "-",
    e.parameter.address2 || "-",
    e.parameter.mobile || "-",
    e.parameter.product,
    e.parameter.quantity,
    e.parameter.specialPrice || "-",
    e.parameter.remarks || "-"
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
