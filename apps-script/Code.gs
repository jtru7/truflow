/**
 * TRUFlow — Google Apps Script Backend
 *
 * Stores the full JSON backup in columns A (timestamp) and B (data) of the
 * "TRUFlow Backup" sheet tab.
 *
 * Deployment:
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Paste this file's contents, save (Ctrl+S)
 *  3. Deploy → New deployment → Web app
 *     Execute as: Me
 *     Who has access: Anyone
 *  4. Copy the web app URL → paste into TRUFlow Settings → Sync URL → Save
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let tab = ss.getSheetByName('TRUFlow Backup');
    if (!tab) tab = ss.insertSheet('TRUFlow Backup');
    tab.clearContents();
    tab.getRange(1, 1).setValue(new Date().toISOString());
    tab.getRange(1, 2).setValue(JSON.stringify(payload));
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tab = ss.getSheetByName('TRUFlow Backup');
    if (!tab) throw new Error('No backup found. Push data first.');
    const json = tab.getRange(1, 2).getValue();
    if (!json) throw new Error('No backup found. Push data first.');
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: JSON.parse(json) }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
