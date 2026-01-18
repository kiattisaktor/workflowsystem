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
            // Map columns A-O (0-14)
            // A=Work, B=Meeting, C=RemarkDate, D=Subject, E=ECM, F=Note, G=Urgent, H=Due, I=Resp, J=Holder, K=Status, L=AssignedTo, M=Remark, N=Order, O=Timestamp
            
            const uniqueId = Utilities.base64EncodeWebSafe(sheetName + "-" + i);
            
            allTasks.push({
                id: uniqueId,
                sheet: sheetName,
                rowIndex: i + 1, // 1-based index for updating
                work: String(row[0]),
                meetingNo: String(row[1]),
                remarkDate: String(row[2]),
                subject: String(row[3]),
                ecm: String(row[4]), // ECM Column
                note: String(row[5]),
                urgent: Boolean(row[6]),
                dueDate: row[7] ? Utilities.formatDate(new Date(row[7]), "GMT+7", "dd/MM/yyyy") : "",
                responsible: String(row[8]),
                currentHolder: String(row[9]), 
                status: String(row[10]),
                assignedTo: String(row[11]),
                remark: String(row[12]),
                order: Number(row[13]) || 0,
                timestamp: String(row[14])
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
  sheet.appendRow([lineUserId, displayName, "", "No Role", new Date()]);

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

// --- CONFIGURATION ---
const CHANNEL_ACCESS_TOKEN = '+VdnkJt3aFnhmoSxHZ42LlA8LGHRTM6Pmkae/x2rqzkpbenMvVwBR4EyiIk07LeBCr/kf/o762Zvj1dggKqEKwx6/B0sp9o1bb/1RtSo1mQTGm1Pkf1T4DPniDsGCyfUdOxlX6SuIf5Gdgaxnc4oyAdB04t89/1O/w1cDnyilFU='; // *** REPLACE WITH YOUR TOKEN ***

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
  // Updated range to read 15 columns (A-O)
  const range = sheet.getRange(rIdx, 1, 1, 15);
  const values = range.getValues()[0];
  const currentOrder = Number(values[13]) || 0; 
  
  // Extract task details for notification
  // A=Work(0), B=Meeting(1), C=RemarkDate(2), D=Subject(3), E=ECM(4), F=Note(5), G=Urgent(6), H=Due(7), I=Resp(8), J=Holder(9)
  // K=Status(10), L=AssignedTo(11), M=Remark(12), N=Order(13), O=Timestamp(14)

  const taskWork = values[0];
  const taskMeeting = values[1];
  const taskSubject = values[3];
  const taskResponsible = values[8]; 

  let oldRowStatus = "ส่งตรวจ"; // Default for SUBMIT
  let newRowStatus = ""; // Default Pending
  let nextUser = nextUserName;
  
  // Notification Variables
  let targetNickName = "";
  let message = "";

  if (actionType === "SUBMIT") {
      // Send for Review
      targetNickName = nextUserName;
      
      message = `ส่งตรวจ - ${taskWork} ${sheetName} ${taskMeeting} ${taskSubject} - ${taskResponsible}`;
      if (remark) {
          message += `\nNote : ${remark}`;
      }
      
  } else if (actionType === "RETURN") {
      oldRowStatus = "ตรวจแล้ว";
      targetNickName = taskResponsible; // Send back to owner

      message = `${currentUserName} ตรวจแล้ว - ${taskWork} ${sheetName} ${taskMeeting} ${taskSubject}`;
      if (remark) {
          message += `\nNote : ${remark}`;
      }

  } else if (actionType === "CLOSE") {
      oldRowStatus = "ปิดงาน";
      nextUser = ""; // No one next
  }

  // 2. Update OLD ROW
  // Status is at Col K (11), AssignedTo at L (12), Remark at M (13), Timestamp at O (15)
  sheet.getRange(rIdx, 11).setValue(oldRowStatus);
  sheet.getRange(rIdx, 12).setValue(nextUser || "-"); 
  sheet.getRange(rIdx, 13).setValue(remark);
  sheet.getRange(rIdx, 15).setValue(new Date());

  // 3. Create NEW ROW (Only if NOT Close)
  if (actionType !== "CLOSE") {
      const newRow = [
          values[0], // Work
          values[1], // Meeting
          values[2], // RemarkDate
          values[3], // Subject
          values[4], // ECM (Copy over)
          values[5], // Note
          values[6], // Urgent
          values[7], // DueDate
          values[8], // Responsible
          nextUser,  // Col J (Holder) -> New Owner
          "",        // Col K (Status) -> Empty
          "",        // Col L (AssignedTo) -> Empty
          "",        // Col M (Remark) -> Empty
          currentOrder + 1, // Col N (Order) -> Increment
          ""  // Col O (Timestamp) -> Empty
      ];
      sheet.appendRow(newRow);
  }

  // 4. Send Notification
  if (targetNickName && message) {
      Logger.log("Attempting to send notification. Target: " + targetNickName);
      const lineUserId = getLineUserIdByNickName(targetNickName);
      if (lineUserId) {
          Logger.log("Found Line User ID: " + lineUserId);
          sendLineMessage(lineUserId, message);
      } else {
          Logger.log("ERROR: Could not find Line User ID for NickName: " + targetNickName);
      }
  } else {
      Logger.log("No notification sent. Target: " + targetNickName + ", Message length: " + message.length);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}


// --- HELPER FUNCTIONS ---

function getLineUserIdByNickName(nickName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  // Col 0: lineUserId, Col 2: NickName
  for (let i = 1; i < data.length; i++) {
    // Normalize comparison (trim and lower case if needed, but let's stick to simple trim for now)
    if (String(data[i][2]).trim() === String(nickName).trim()) {
      return data[i][0];
    }
  }
  return null;
}

function sendLineMessage(userId, message) {
  if (!CHANNEL_ACCESS_TOKEN) {
      Logger.log("Channel Access Token not configured.");
      return;
  }

  const url = 'https://api.line.me/v2/bot/message/push';
  const data = {
    to: userId,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    Logger.log("Line API Response Code: " + responseCode);
    Logger.log("Line API Response Body: " + responseBody);
  } catch (e) {
    Logger.log("Error sending Line message: " + e.toString());
  }
}

// --- ONE-TIME SETUP ---
// Run this function once from the editor to grant permissions!
function authorizeScript() {
  UrlFetchApp.fetch("https://www.google.com");
  Logger.log("Permissions granted!");
}
