function doGet() {
  return HtmlService.createHtmlOutput("Backend API is running.");
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'getUsers') {
    return getUsers();
  } else if (action === 'forwardTask') {
    return forwardTask(data);
  } else if (action === 'registerUser') {
    return registerUser(data);
  } else if (action === 'getTasks') {
    return getTasks();
  } else {
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ["Board", "Excom"];
  const allTasks = [];

  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    // Start from row 1 (skipping header 0)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) { // If 'Work' column exists
            // Map columns A-M (0-12)
            // A=Work, B=Meeting, C=RemarkDate, D=Subject, E=Note, F=Urgent, G=Due, H=Resp, I=Holder, J=Status, K=AssignedTo, L=Remark, M=Order, N=Timestamp
            // We use row index + Sheet as ID for now to be distinct
            // Actually, let's create a composite ID: Sheet-Work-Meeting-Subject-Order-RowIndex
            const uniqueId = Utilities.base64EncodeWebSafe(sheetName + "-" + i);
            
            allTasks.push({
                id: uniqueId,
                sheet: sheetName,
                rowIndex: i + 1, // 1-based index for updating
                work: String(row[0]),
                meetingNo: String(row[1]),
                remarkDate: String(row[2]),
                subject: String(row[3]),
                note: String(row[4]),
                urgent: Boolean(row[5]),
                dueDate: row[6] ? Utilities.formatDate(new Date(row[6]), "GMT+7", "dd/MM/yyyy") : "",
                responsible: String(row[7]),
                currentHolder: String(row[8]), // งานอยู่ที่
                status: String(row[9]),
                assignedTo: String(row[10]),
                remark: String(row[11]),
                order: Number(row[12]) || 0,
                timestamp: String(row[13])
            });
        }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(allTasks)).setMimeType(ContentService.MimeType.JSON);
}

function registerUser(data) {
  const { lineUserId, displayName } = data;
  if (!lineUserId || !displayName) {
     return ContentService.createTextOutput(JSON.stringify({ error: "Missing data" })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Users sheet missing" })).setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();
  // Check if user already exists
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === lineUserId) {
      // User exists, maybe update display name? For now just return success.
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User already registered", id: lineUserId })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Append new user
  // Columns: lineUserId(A), displayName(B), NickName(C), Role(D), registeredAt(E)
  sheet.appendRow([lineUserId, displayName, "", "Owner", new Date()]);

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "User registered", id: lineUserId })).setMimeType(ContentService.MimeType.JSON);
}

function getUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  
  if (!sheet) {
    // Fallback if sheet doesn't exist yet, avoiding crashing
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const users = [];

  // Assuming Row 1 is headers: 
  // Col 0: lineUserId
  // Col 1: displayName
  // Col 2: NickName
  // Col 3: Role
  // Col 4: registeredAt
  for (let i = 1; i < data.length; i++) {
    const lineUserId = data[i][0];
    const displayName = data[i][1];
    const nickName = data[i][2];
    const role = data[i][3];

    if (lineUserId && displayName) {
      users.push({ 
        name: displayName, 
        id: lineUserId,
        nickName: String(nickName),
        role: String(role)
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(users)).setMimeType(ContentService.MimeType.JSON);
}

function forwardTask(data) {
  const { sheetName, rowIndex, remark, nextUserName, currentUserName, actionType } = data;
  // actionType: "SUBMIT" (Review), "RETURN" (Approved/Return to Owner), "CLOSE" (Done)

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName); 
  
  if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);
  }

  const rIdx = Number(rowIndex);
  
  // 1. Get current row data
  const range = sheet.getRange(rIdx, 1, 1, 14);
  const values = range.getValues()[0];
  const currentOrder = Number(values[12]) || 0; 

  // Col J (Status/Col 10), K (AssignedTo/Col 11), L (Remark/Col 12), N (Timestamp/Col 14)
  
  let oldRowStatus = "ส่งตรวจ"; // Default for SUBMIT
  let newRowStatus = ""; // Default Pending
  let nextUser = nextUserName;

  if (actionType === "RETURN") {
      oldRowStatus = "ตรวจแล้ว";
      // Next user is typically the responsible person (Col H / Index 7)
      // BUT frontend should pass the correct 'nextUserName' (Responsible).
      // We accept nextUserName from frontend for flexibility.
  } else if (actionType === "CLOSE") {
      oldRowStatus = "ปิดงาน";
      nextUser = ""; // No one next
  }

  // 2. Update OLD ROW
  sheet.getRange(rIdx, 10).setValue(oldRowStatus);
  sheet.getRange(rIdx, 11).setValue(nextUser || "-"); // If close, set -
  sheet.getRange(rIdx, 12).setValue(remark);
  sheet.getRange(rIdx, 14).setValue(new Date());

  // 3. Create NEW ROW (Only if NOT Close? Or Create 'Done' row?)
  // User said "[Close] = Check complete".
  // Usually this means the workflow ENDS. So no new row.
  if (actionType !== "CLOSE") {
      const newRow = [
          values[0], // Work
          values[1], // Meeting
          values[2], // RemarkDate
          values[3], // Subject
          values[4], // Note
          values[5], // Urgent
          values[6], // DueDate
          values[7], // Responsible
          nextUser,  // Col I (งานอยู่ที่) -> New Owner
          "",        // Col J (Status) -> Empty (Pending)
          "",        // Col K (AssignedTo) -> Empty
          "",        // Col L (Remark) -> Empty
          currentOrder + 1, // Col M (Order) -> Increment
          ""  // Col N (Timestamp) -> Empty for new row
      ];
      sheet.appendRow(newRow);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}
