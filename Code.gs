/**
 * APLIKASI PRESENSI PEGAWAI BERBASIS LOKASI & SELFIE (V2 - PROFESSIONAL)
 * Backend Google Apps Script
 */

function doGet(e) {
  setupDatabase();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Presensi Mobile Premium')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Inisialisasi Database Google Sheets
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet SETTINGS
  var sheetSettings = ss.getSheetByName('SETTINGS');
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet('SETTINGS');
    sheetSettings.appendRow(['Office Lat', 'Office Lng', 'Radius (Meter)', 'WA Token']);
    sheetSettings.appendRow([0,573993, 101,423744, 100, 'YOUR-TOKE-FONNTE']);
  }

  // 2. Sheet USERS
  var sheetUsers = ss.getSheetByName('USERS');
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet('USERS');
    sheetUsers.appendRow(['NIP', 'Nama', 'Role', 'No WA', 'PIN']);
    sheetUsers.appendRow(['1001', 'Budi Santoso', 'Pegawai', '6281234567890', '1234']);
    sheetUsers.appendRow(['1002', 'Siti Aminah', 'Pegawai', '6289876543210', '1234']);
    sheetUsers.appendRow(['9999', 'Admin Utama', 'Admin', '6281111111111', '1234']);
  } else {
    // Pastikan kolom PIN ada jika sheet sudah dibuat sebelumnya
    var lastCol = sheetUsers.getLastColumn();
    var headers = sheetUsers.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];
    if (headers.length < 5 || headers[4] !== 'PIN') {
      sheetUsers.getRange(1, 5).setValue('PIN');
      var lastRow = sheetUsers.getLastRow();
      if (lastRow > 1) {
        for (var r = 2; r <= lastRow; r++) {
          if (!sheetUsers.getRange(r, 5).getValue()) {
            sheetUsers.getRange(r, 5).setValue('1234');
          }
        }
      }
    }
  }

  // 3. Sheet ATTENDANCE_LOG
  var sheetLog = ss.getSheetByName('ATTENDANCE_LOG');
  if (!sheetLog) {
    sheetLog = ss.insertSheet('ATTENDANCE_LOG');
    sheetLog.appendRow(['Timestamp', 'NIP', 'Nama', 'Tipe', 'Status', 'Jarak (m)', 'Latitude', 'Longitude', 'Foto URL']);
  }

  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    try { ss.deleteSheet(defaultSheet); } catch(e){}
  }
}

// System Auth Login
function loginUser(nip, pin) {
  try {
    setupDatabase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var uData = ss.getSheetByName('USERS').getDataRange().getValues();
    
    var inputNip = String(nip || '').trim();
    var inputPin = String(pin || '').trim();

    for (var i = 1; i < uData.length; i++) {
      var storedNip = String(uData[i][0] || '').trim();
      var storedName = String(uData[i][1] || '').trim();
      var storedRole = String(uData[i][2] || '').trim();
      var storedWa = String(uData[i][3] || '').trim();
      var storedPin = (uData[i].length > 4 && uData[i][4] !== '') ? String(uData[i][4]).trim() : '1234';

      if (storedNip === inputNip && storedPin === inputPin) {
        return {
          success: true,
          user: {
            nip: storedNip,
            nama: storedName,
            role: storedRole,
            noWa: storedWa
          }
        };
      }
    }
    return { success: false, message: 'NIP atau PIN yang Anda masukkan salah!' };
  } catch (err) {
    return { success: false, message: 'Terjadi kesalahan sistem: ' + err.toString() };
  }
}

// Ambil Data Inisialisasi Pengaturan Kantor
function getInitialData() {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sData = ss.getSheetByName('SETTINGS').getDataRange().getValues();
  var settings = {
    lat: Number(sData[1][0]) || -6.175392,
    lng: Number(sData[1][1]) || 106.827153,
    radius: Number(sData[1][2]) || 100,
    waToken: String(sData[1][3] || '')
  };

  return { settings: settings };
}

// Update Pengaturan Geofence Kantor oleh Admin
function updateSettings(lat, lng, radius, waToken) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('SETTINGS');
    sheet.getRange(2, 1, 1, 4).setValues([[Number(lat), Number(lng), Number(radius), String(waToken)]]);
    return { success: true, message: 'Pengaturan Geofencing Kantor Berhasil Diperbarui!' };
  } catch(e) {
    return { success: false, message: 'Gagal menyimpan pengaturan: ' + e.toString() };
  }
}

// Tambah Pegawai Baru
function addUser(nip, nama, role, noWa, pin) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('USERS');
    var uData = sheet.getDataRange().getValues();
    
    for (var i = 1; i < uData.length; i++) {
      if (String(uData[i][0]).trim() === String(nip).trim()) {
        return { success: false, message: 'NIP sudah terdaftar di sistem!' };
      }
    }
    
    sheet.appendRow([nip, nama, role, noWa, pin || '1234']);
    return { success: true, message: 'Pegawai baru berhasil ditambahkan!' };
  } catch(e) {
    return { success: false, message: 'Gagal menambah pegawai: ' + e.toString() };
  }
}

// Simpan Absensi
function submitAttendance(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = getInitialData().settings;
  
  var distance = calculateDistance(payload.lat, payload.lng, settings.lat, settings.lng);
  var isWithinRadius = distance <= settings.radius;
  var status = isWithinRadius ? 'BERHASIL' : 'DITOLAK (Luar Radius)';

  if (!isWithinRadius) {
    return {
      success: false,
      message: 'Absensi Ditolak! Anda berada ' + Math.round(distance) + ' meter dari kantor (Batas Toleransi: ' + settings.radius + 'm).'
    };
  }

  var photoUrl = saveImageToDrive(payload.imageBase64, payload.nip + '_' + new Date().getTime() + '.jpg');
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  var sheetLog = ss.getSheetByName('ATTENDANCE_LOG');
  sheetLog.appendRow([now, payload.nip, payload.nama, payload.tipe, status, Math.round(distance), payload.lat, payload.lng, photoUrl]);

  if (payload.noWa && settings.waToken) {
    var msg = "📌 *NOTIFIKASI ABSENSI PEGAWAI*\n\n" +
              "Nama: " + payload.nama + "\n" +
              "NIP: " + payload.nip + "\n" +
              "Tipe: " + payload.tipe + "\n" +
              "Waktu: " + now + "\n" +
              "Jarak: " + Math.round(distance) + " Meter\n" +
              "Status: BERHASIL ✅";
    sendWhatsAppNotification(payload.noWa, msg, settings.waToken);
  }

  return {
    success: true,
    message: 'Absensi ' + payload.tipe + ' Berhasil Dicatat!',
    distance: Math.round(distance)
  };
}

// Ambil Laporan Log Absensi (Support Filter NIP, Tanggal, Bulan)
function getAttendanceLogs(filterDate, filterMonth, nipFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLog = ss.getSheetByName('ATTENDANCE_LOG');
  var data = sheetLog.getDataRange().getValues();
  var logs = [];

  for (var i = 1; i < data.length; i++) {
    var rowTime = data[i][0];
    var formattedTime = (rowTime instanceof Date) ? Utilities.formatDate(rowTime, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : rowTime;
    var rowNip = String(data[i][1]);

    var matchDate = !filterDate || formattedTime.startsWith(filterDate);
    var matchMonth = !filterMonth || formattedTime.startsWith(filterMonth);
    var matchNip = !nipFilter || rowNip === String(nipFilter);

    if (matchDate && matchMonth && matchNip) {
      logs.push({
        timestamp: formattedTime,
        nip: rowNip,
        nama: data[i][2],
        tipe: data[i][3],
        status: data[i][4],
        jarak: data[i][5],
        lat: data[i][6],
        lng: data[i][7],
        foto: data[i][8]
      });
    }
  }
  return logs.reverse();
}

// Ambil Statistik Ringkas Dashboard Admin
function getAdminDashboardStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  var totalPegawai = ss.getSheetByName('USERS').getLastRow() - 1;
  var logData = ss.getSheetByName('ATTENDANCE_LOG').getDataRange().getValues();
  
  var totalAbsenHariIni = 0;
  var totalBerhasil = 0;
  var totalDitolak = 0;

  for (var i = 1; i < logData.length; i++) {
    var timeStr = (logData[i][0] instanceof Date) ? Utilities.formatDate(logData[i][0], Session.getScriptTimeZone(), "yyyy-MM-dd") : logData[i][0];
    if (timeStr.startsWith(today)) {
      totalAbsenHariIni++;
      if (logData[i][4] === 'BERHASIL') totalBerhasil++;
      else totalDitolak++;
    }
  }

  return {
    totalPegawai: totalPegawai > 0 ? totalPegawai : 0,
    totalAbsenHariIni: totalAbsenHariIni,
    totalBerhasil: totalBerhasil,
    totalDitolak: totalDitolak
  };
}

// Formula Haversine (Hitung Jarak GPS)
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Simpan Gambar ke Drive
function saveImageToDrive(base64Data, filename) {
  var folderName = "Presensi_Photos_Folder";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var contentType = base64Data.substring(5, base64Data.indexOf(';'));
  var bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf('base64,') + 7));
  var blob = Utilities.newBlob(bytes, contentType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

// Kirim Notifikasi WA (Fonnte API)
function sendWhatsAppNotification(targetPhone, message, token) {
  try {
    UrlFetchApp.fetch('https://api.fonnte.com/send', {
      'method': 'post',
      'headers': {'Authorization': token},
      'payload': {'target': targetPhone, 'message': message},
      'muteHttpExceptions': true
    });
  } catch(e) {
    Logger.log("WA Failed: " + e.toString());
  }
}