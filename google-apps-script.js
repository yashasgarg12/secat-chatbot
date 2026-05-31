// ═══════════════════════════════════════════════════════════
// SECaT Chatbot — Google Apps Script Backend
// Deploy this as a Google Apps Script Web App.
// It stores session data in a Google Sheet and serves it as JSON.
// ═══════════════════════════════════════════════════════════

// Sheet name constants
const SESSIONS_SHEET = "Sessions";
const CSV_SHEET = "CSV_Data";

// ─── SETUP: Run this once to create the sheets ───
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Sessions sheet
  let sessionsSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet(SESSIONS_SHEET);
    sessionsSheet.appendRow(["SessionID", "CourseCode", "CourseName", "Semester", "Mode", "AvgScore", "TotalResponses", "ExportedAt", "FullJSON"]);
    sessionsSheet.getRange("1:1").setFontWeight("bold").setBackground("#E8DFF0");
    sessionsSheet.setColumnWidth(9, 400);
  }

  // Create CSV sheet
  let csvSheet = ss.getSheetByName(CSV_SHEET);
  if (!csvSheet) {
    csvSheet = ss.insertSheet(CSV_SHEET);
    csvSheet.appendRow(["Course", "Question", "Type", "Response", "Sentiment", "Timestamp", "SessionID"]);
    csvSheet.getRange("1:1").setFontWeight("bold").setBackground("#E8DFF0");
  }

  Logger.log("Setup complete! Sheets created.");
}

// ─── GET: Return all sessions as JSON ───
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "sessions";

    if (action === "sessions") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SESSIONS_SHEET);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse([]);
      }

      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
      const sessions = data.map(row => {
        try {
          return JSON.parse(row[8]); // FullJSON column
        } catch (err) {
          return null;
        }
      }).filter(s => s !== null);

      return jsonResponse(sessions);
    }

    return jsonResponse({ error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ─── POST: Save session data ───
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || "save-session";

    if (action === "save-session") {
      return saveSession(body.data);
    }

    if (action === "save-csv") {
      return saveCSV(body.courseCode, body.rows);
    }

    if (action === "clear-data") {
      return clearData();
    }

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ─── Save full session JSON (upsert by sessionId) ───
function saveSession(data) {
  if (!data || !data.course || !data.course.code) {
    return jsonResponse({ error: "Missing course.code" });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sheet) { setup(); sheet = ss.getSheetByName(SESSIONS_SHEET); }

  const row = [
    data.sessionId || "",
    data.course.code || "",
    data.course.name || "",
    data.course.semester || "",
    data.course.mode || "",
    data.summary ? data.summary.averageScore : "",
    data.summary ? data.summary.totalResponses : "",
    data.exportedAt || new Date().toISOString(),
    JSON.stringify(data)
  ];

  // Upsert: if sessionId exists, update that row; otherwise append
  if (data.sessionId && sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (ids[i][0] === data.sessionId) {
        sheet.getRange(i + 2, 1, 1, 9).setValues([row]);
        return jsonResponse({ ok: true, message: "Session updated" });
      }
    }
  }

  sheet.appendRow(row);

  return jsonResponse({ ok: true, message: "Session saved" });
}

// ─── Save CSV rows ───
function saveCSV(courseCode, rows) {
  if (!courseCode || !rows) {
    return jsonResponse({ error: "Missing courseCode or rows" });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CSV_SHEET);
  if (!sheet) { setup(); sheet = ss.getSheetByName(CSV_SHEET); }

  // Parse CSV rows and append
  const lines = rows.trim().split("\n").filter(l => l.trim());
  lines.forEach(line => {
    // Parse quoted CSV fields
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { fields.push(current); current = ""; }
      else { current += ch; }
    }
    fields.push(current);
    sheet.appendRow(fields);
  });

  return jsonResponse({ ok: true, message: "CSV rows appended" });
}

// ─── Clear all data ───
function clearData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sessionsSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (sessionsSheet && sessionsSheet.getLastRow() > 1) {
    sessionsSheet.deleteRows(2, sessionsSheet.getLastRow() - 1);
  }

  const csvSheet = ss.getSheetByName(CSV_SHEET);
  if (csvSheet && csvSheet.getLastRow() > 1) {
    csvSheet.deleteRows(2, csvSheet.getLastRow() - 1);
  }

  return jsonResponse({ ok: true, message: "All data cleared" });
}

// ─── Helper: JSON response with CORS ───
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
