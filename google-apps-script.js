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

// Handle POST requests — saves order(s) to the "Orders" sheet
// Supports multiple products per order (one row per product)
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Orders");

  // Auto-create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Time", "Employee", "Retailer", "Address", "Address2", "Mobile No", "Product", "Quantity", "Unit", "Special Price", "Remarks"]);
    sheet.getRange("1:1").setFontWeight("bold");
  }

  var now = new Date();
  var date = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
  var time = Utilities.formatDate(now, Session.getScriptTimeZone(), "hh:mm a");

  var employee = e.parameter.employee;
  var retailer = e.parameter.retailer;
  var address = e.parameter.address || "-";
  var address2 = e.parameter.address2 || "-";
  var mobile = e.parameter.mobile || "-";
  var remarks = e.parameter.remarks || "-";

  // Parse products array (multiple products per order)
  var productsJson = e.parameter.products;
  if (productsJson) {
    var products = JSON.parse(productsJson);
    for (var i = 0; i < products.length; i++) {
      sheet.appendRow([
        date, time, employee, retailer, address, address2, mobile,
        products[i].product,
        products[i].quantity,
        products[i].unit || "-",
        products[i].specialPrice || "-",
        remarks
      ]);
    }
  } else {
    // Fallback: single product (backwards compatible)
    sheet.appendRow([
      date, time, employee, retailer, address, address2, mobile,
      e.parameter.product || "-",
      e.parameter.quantity || "-",
      e.parameter.unit || "-",
      e.parameter.specialPrice || "-",
      remarks
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
