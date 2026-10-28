// Salin file ini ke Apps Script setelah mengganti tiga nilai konfigurasi di bawah.
// Deploy sebagai Web App hanya setelah kode ini ditempel dan disimpan.

// COPAS GOOGLE SPREADSHEET ID YANG DIGUNAKAN
const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Lamaran";
const JOBS_SHEET_NAME = "Lowongan";
const JOB_LOG_SHEET_NAME = "Log Lowongan";

function doGet() {
  try {
    return ContentService.createTextOutput(JSON.stringify({ ok: true, jobs: readJobs_() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, message: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
// COPAS GOOGLE DRIVE ID YANG DIGUNAKAN
const DRIVE_FOLDER_ID = "PASTE_DRIVE_FOLDER_ID_HERE";
// ID folder Drive khusus flyer lowongan; isi dengan ID folder "Gambar Flyer" milik admin.
const FLYER_FOLDER_ID = "PASTE_FLYER_FOLDER_ID_HERE";
const MAX_FLYER_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function doPost(e) {
  const createdFiles = [];
  const createdFolders = [];
  let stage = "Membaca permintaan";
  let requestId = "";

  try {
    if (isJobRequest_(e)) {
      return handleJobRequest_(e);
    }

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Isi permintaan kosong.");
    }

    const payload = parseApplicationPayload_(e);
    requestId = String(payload.requestId || "");
    stage = "Memvalidasi data dan dokumen";
    validateApplication_(payload);

    stage = "Membuka folder Drive";
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    stage = "Membuat folder pelamar di Drive";
    const applicantFolderName = buildApplicantFolderName_(payload.name, payload.position);
    const applicantFolder = folder.createFolder(applicantFolderName);
    createdFolders.push(applicantFolder);

    stage = "Menyimpan dokumen ke folder pelamar";
    const fileLinks = saveFiles_(applicantFolder, payload.files, createdFiles);

    stage = "Membuka spreadsheet dan tab lamaran";
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Tab spreadsheet "' + SHEET_NAME + '" tidak ditemukan.');

    stage = "Menulis data lamaran ke spreadsheet";
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([
        new Date(),
        safeCell_(payload.position),
        safeCell_(payload.name),
        safeCell_(payload.email),
        safeCell_(payload.gender),
        safeCell_(payload.phone),
        safeCell_(payload.birthDetails),
        safeCell_(payload.bloodType),
        safeCell_(payload.address),
        fileLinks.cv || "",
        fileLinks.ktp || "",
        fileLinks.kk || "",
        fileLinks.portfolio || "",
      ]);
    } finally {
      lock.releaseLock();
    }

    writeApplicationLog_("BERHASIL", "Lamaran dan dokumen tersimpan.");
    return applicationResponse_({
      type: "application-result",
      requestId: requestId,
      ok: true,
      message: "Lamaran dan dokumen tersimpan.",
    });
  } catch (error) {
    createdFiles.forEach(function (file) {
      try {
        file.setTrashed(true);
      } catch (cleanupError) {
        console.error("Gagal membersihkan file sementara:", cleanupError);
      }
    });
    createdFolders.forEach(function (folder) {
      try {
        folder.setTrashed(true);
      } catch (cleanupError) {
        console.error("Gagal membersihkan folder sementara:", cleanupError);
      }
    });
    const errorMessage = error && error.message ? error.message : String(error);
    const diagnosticMessage = "Tahap: " + stage + ". " + errorMessage;
    console.error("Lamaran gagal disimpan:", diagnosticMessage, error && error.stack);
    writeApplicationLog_("GAGAL", diagnosticMessage);
    return applicationResponse_({
      type: "application-result",
      requestId: requestId,
      ok: false,
      message: diagnosticMessage,
    });
  }
}

function isJobRequest_(e) {
  const params = e && e.parameter;
  if (params && params.type === "job") return true;
  try {
    return Boolean(e && e.postData && e.postData.contents && JSON.parse(e.postData.contents).type === "job");
  } catch (error) {
    return false;
  }
}

function handleJobRequest_(e) {
  let flyerFile = null;
  let actionCommitted = false;
  let action = "list";
  try {
    const payload = e.parameter && e.parameter.type === "job"
      ? e.parameter
      : parseApplicationPayload_(e);
    action = String(payload.action || "list").toLowerCase();

    if ((action === "create" || action === "update") && payload.imageBase64) {
      flyerFile = saveJobFlyer_(payload);
      payload.image = flyerFile.url;
    }

    let result;
    if (action === "list") result = readJobs_();
    else if (action === "create") result = createJob_(payload);
    else if (action === "update") result = updateJob_(payload);
    else if (action === "delete") result = deleteJob_(payload);
    else if (action === "toggle") result = toggleJob_(payload);
    else throw new Error("Aksi lowongan tidak dikenal: " + action);
    actionCommitted = true;
    writeJobLog_("BERHASIL", action + " lowongan.");
    return applicationResponse_({ type: "job-result", ok: true, action: action, jobs: readJobs_(), result: result });
  } catch (error) {
    if (flyerFile && !actionCommitted) {
      try { flyerFile.file.setTrashed(true); } catch (cleanupError) {
        console.error("Gagal membersihkan flyer sementara:", cleanupError);
      }
    }
    const message = error && error.message ? error.message : String(error);
    writeJobLog_("GAGAL", message);
    return applicationResponse_({ type: "job-result", ok: false, message: message });
  }
}

function getJobsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(JOBS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(JOBS_SHEET_NAME);
    sheet.appendRow(["ID", "Posisi", "Kualifikasi", "Gambar", "Status"]);
  }
  return sheet;
}

function readJobs_() {
  const sheet = getJobsSheet_();
  const values = sheet.getDataRange().getValues();
  return values.slice(1).filter(row => row[0] !== "").map(row => ({
    id: Number(row[0]), title: String(row[1] || ""),
    qualifications: String(row[2] || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean),
    image: String(row[3] || ""), active: String(row[4]).toLowerCase() === "true" || row[4] === true,
  }));
}

function createJob_(payload) {
  const sheet = getJobsSheet_();
  const jobs = readJobs_();
  const id = jobs.length ? Math.max.apply(null, jobs.map(job => job.id)) + 1 : 1;
  const qualifications = Array.isArray(payload.qualifications) ? payload.qualifications : String(payload.qualifications || "").split(/\r?\n/);
  sheet.appendRow([id, safeCell_(payload.title), safeCell_(qualifications.join("\n")), safeCell_(payload.image), String(payload.active) === "true"]);
  return { id: id };
}

function updateJob_(payload) {
  const sheet = getJobsSheet_();
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, i) => i > 0 && Number(row[0]) === Number(payload.id));
  if (index < 1) throw new Error("Lowongan tidak ditemukan.");
  const qualifications = Array.isArray(payload.qualifications) ? payload.qualifications : String(payload.qualifications || "").split(/\r?\n/);
  sheet.getRange(index + 1, 1, 1, 5).setValues([[Number(payload.id), safeCell_(payload.title), safeCell_(qualifications.join("\n")), safeCell_(payload.image), String(payload.active) === "true"]]);
  return { id: Number(payload.id) };
}

function saveJobFlyer_(payload) {
  if (!FLYER_FOLDER_ID || FLYER_FOLDER_ID === "PASTE_FLYER_FOLDER_ID_HERE") {
    throw new Error("FLYER_FOLDER_ID belum diatur ke ID folder Gambar Flyer.");
  }
  const mimeType = String(payload.imageMimeType || "").toLowerCase();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.indexOf(mimeType) === -1) {
    throw new Error("Format flyer harus JPG, PNG, atau WEBP.");
  }
  if (!payload.imageBase64) throw new Error("Data file flyer kosong.");

  const bytes = Utilities.base64Decode(String(payload.imageBase64));
  if (bytes.length > MAX_FLYER_FILE_SIZE_BYTES) {
    throw new Error("Ukuran flyer melebihi 5 MB.");
  }
  const safeName = String(payload.imageFileName || "flyer")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "_")
    .slice(0, 100);
  const folder = DriveApp.getFolderById(FLYER_FOLDER_ID);
  const file = folder.createFile(Utilities.newBlob(bytes, mimeType, Date.now() + "_" + safeName));
  try {
    // Website karier publik perlu dapat memuat flyer tanpa login Drive.
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    file.setTrashed(true);
    throw new Error("Flyer tersimpan, tetapi akses lihat dengan link ditolak oleh kebijakan Drive: " + (error.message || error));
  }
  return {
    file: file,
    url: "https://drive.google.com/thumbnail?id=" + encodeURIComponent(file.getId()) + "&sz=w1600",
  };
}
function deleteJob_(payload) {
  const sheet = getJobsSheet_();
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, i) => i > 0 && Number(row[0]) === Number(payload.id));
  if (index < 1) throw new Error("Lowongan tidak ditemukan.");
  sheet.deleteRow(index + 1);
  return { id: Number(payload.id) };
}

function toggleJob_(payload) {
  const sheet = getJobsSheet_();
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, i) => i > 0 && Number(row[0]) === Number(payload.id));
  if (index < 1) throw new Error("Lowongan tidak ditemukan.");
  const current = String(rows[index][4]).toLowerCase() === "true" || rows[index][4] === true;
  const next = payload.active === undefined ? !current : String(payload.active).toLowerCase() === "true";
  sheet.getRange(index + 1, 5).setValue(next);
  return { id: Number(payload.id), active: next };
}

function writeJobLog_(status, message) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(JOB_LOG_SHEET_NAME);
  if (!sheet) { sheet = spreadsheet.insertSheet(JOB_LOG_SHEET_NAME); sheet.appendRow(["Waktu", "Status", "Tahap / Pesan"]); }
  sheet.appendRow([new Date(), status, message]);
}

function writeApplicationLog_(status, message) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName("Log Lamaran");
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet("Log Lamaran");
      logSheet.appendRow(["Waktu", "Status", "Tahap / Pesan"]);
    }
    logSheet.appendRow([new Date(), status, message]);
  } catch (logError) {
    console.error("Gagal menulis Log Lamaran:", logError);
  }
}

function validateApplication_(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Format data tidak valid.");
  ["position", "name", "email", "gender", "phone", "birthDetails", "bloodType", "address"].forEach(function (key) {
    if (!String(payload[key] || "").trim()) throw new Error("Data wajib belum lengkap: " + key);
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    throw new Error("Format email tidak valid.");
  }

  const files = payload.files || {};
  ["cv", "ktp", "kk"].forEach(function (key) {
    if (!files[key] || !files[key].base64) throw new Error("Dokumen wajib belum ada: " + key);
  });

  let totalBytes = 0;
  Object.keys(files).forEach(function (key) {
    const file = files[key];
    if (!file || !file.base64) return;
    const bytes = Utilities.base64Decode(file.base64);
    if (bytes.length > MAX_FILE_SIZE_BYTES) throw new Error("Ukuran dokumen melebihi 5 MB.");
    totalBytes += bytes.length;
    const allowedTypes = key === "cv" || key === "portfolio"
      ? ["application/pdf"]
      : ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.indexOf(file.mimeType) === -1) throw new Error("Format dokumen tidak didukung: " + key);
  });
  if (totalBytes > MAX_TOTAL_FILE_SIZE_BYTES) throw new Error("Total ukuran dokumen melebihi 15 MB.");
}

function saveFiles_(folder, files, createdFiles) {
  const links = {};
  Object.keys(files || {}).forEach(function (key) {
    const file = files[key];
    if (!file || !file.base64) return;

    const bytes = Utilities.base64Decode(file.base64);
    const safeName = String(file.name || key)
      .replaceAll("/", "_")
      .replaceAll("\\", "_")
      .replaceAll(":", "_")
      .replaceAll("*", "_")
      .replaceAll("?", "_")
      .replaceAll('"', "_")
      .replaceAll("<", "_")
      .replaceAll(">", "_")
      .replaceAll("|", "_")
      .slice(0, 100);
    const blob = Utilities.newBlob(bytes, file.mimeType, Date.now() + "_" + key + "_" + safeName);
    const savedFile = folder.createFile(blob);
    createdFiles.push(savedFile);
    links[key] = savedFile.getUrl();
  });
  return links;
}

function buildApplicantFolderName_(name, position) {
  const safePart = function (value, fallback) {
    return String(value || fallback)
      .trim()
      .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 80);
  };
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Jakarta", "yyyyMMdd-HHmmss");
  return safePart(name, "Pelamar") + " - " + safePart(position, "Lamaran") + " - " + timestamp;
}

function safeCell_(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function parseApplicationPayload_(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  let contents = e.postData.contents;
  const contentType = String(e.postData.type || "").toLowerCase();
  if (contentType.indexOf("text/plain") === 0 && contents.indexOf("payload=") === 0) {
    contents = contents.substring("payload=".length).replace(/\r?\n$/, "");
  }
  return JSON.parse(contents);
}

function applicationResponse_(value) {
  const safeJson = JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const html = "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" +
    "<script>window.parent.postMessage(" + safeJson + ", \"*\");</script></body></html>";
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function authorizeDriveAccess() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log("Drive OK: " + folder.getName());
}

function authorizeDriveWriteAccess() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file = folder.createFile(
      "apps-script-drive-write-test.txt",
      "Temporary permission test"
    );
    Logger.log("CREATE OK — file ID: " + file.getId());
  } catch (error) {
    Logger.log("DRIVE ERROR: " + (error.stack || error));
    // throw error;
  }
}
