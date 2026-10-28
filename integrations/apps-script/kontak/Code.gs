// Backend khusus form kontak EMAS Corp.
// Tempel ke Apps Script yang terikat ke spreadsheet Kontak, lalu isi ID spreadsheet.
const CONTACT_SPREADSHEET_ID = "PASTE_CONTACT_SPREADSHEET_ID_HERE";
const CONTACT_SHEET_NAME = "Kontak";
const CONTACT_LOG_SHEET_NAME = "Log Kontak";

function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};
  try {
    const contact = {
      name: String(params.nama || "").trim(),
      whatsapp: String(params.wa || "").trim(),
      email: String(params.email || "").trim(),
      message: String(params.pesan || "").trim(),
    };
    if (!contact.name || !contact.whatsapp || !contact.email || !contact.message) {
      throw new Error("Data kontak belum lengkap.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      throw new Error("Format email kontak tidak valid.");
    }
    const spreadsheet = SpreadsheetApp.openById(CONTACT_SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONTACT_SHEET_NAME);
      sheet.appendRow(["Waktu", "Nama", "WhatsApp", "Email", "Pesan"]);
    }
    sheet.appendRow([new Date(), safeCell_(contact.name), safeCell_(contact.whatsapp), safeCell_(contact.email), safeCell_(contact.message)]);
    writeContactLog_("BERHASIL", "Pesan kontak tersimpan.");
    return jsonResponse_({ ok: true, message: "Pesan kontak tersimpan." });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    writeContactLog_("GAGAL", message);
    return jsonResponse_({ ok: false, message: message });
  }
}

function writeContactLog_(status, message) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONTACT_SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONTACT_LOG_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONTACT_LOG_SHEET_NAME);
      sheet.appendRow(["Waktu", "Status", "Tahap / Pesan"]);
    }
    sheet.appendRow([new Date(), status, message]);
  } catch (error) {
    console.error("Gagal menulis Log Kontak:", error);
  }
}

function safeCell_(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}