/**
 * APLIKASI PRESENSI PEGAWAI BERBASIS LOKASI & SELFIE (V2 - PROFESSIONAL)
 * Backend Google Apps Script (Refactored)
 */

// ==========================================
// KONFIGURASI SISTEM
// ==========================================
const CONFIG = {
  SHEET: {
    SETTINGS: 'SETTINGS',
    USERS: 'USERS',
    LOG: 'ATTENDANCE_LOG'
  },
  FOLDER_NAME: 'Presensi_Photos_Folder',
  DEFAULT_PIN: '1234',
  HEADERS: {
    SETTINGS: ['Office Lat', 'Office Lng', 'Radius (Meter)', 'Legacy WA Token (unused)', 'Masuk Mulai', 'Masuk Selesai', 'Pulang Mulai', 'Pulang Selesai'],
    USERS: ['NIP', 'Nama', 'Role', 'No WA', 'PIN'],
    LOG: ['Timestamp', 'NIP', 'Nama', 'Tipe', 'Status', 'Jarak (m)', 'Latitude', 'Longitude', 'Foto URL', 'Durasi Kerja (Jam)', 'Transport (Rp)']
  },
  DEFAULTS: {
    SETTINGS: [0.573993, 101.423744, 100, '', '06:00', '10:00', '14:00', '23:59']
  }
};

// Helper: Ambil Spreadsheet aktif
const getAppSpreadsheet = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak ditemukan. Pastikan script terikat pada file Google Sheets.');
  return ss;
};

// Helper: Ambil Sheet berdasarkan nama, buat jika belum ada
const getOrCreateSheet = (ss, sheetName, headers) => {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
};

// ==========================================
// ROUTING WEB APP
// ==========================================
function doGet(e) {
  setupDatabase(); // Pastikan DB siap setiap kali web diakses
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Presensi Mobile Premium')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==========================================
// INIT & REPAIR DATABASE
// ==========================================
function setupDatabase() {
  const ss = getAppSpreadsheet();
  
  // 1. Setup SETTINGS
  const sheetSettings = getOrCreateSheet(ss, CONFIG.SHEET.SETTINGS, CONFIG.HEADERS.SETTINGS);
  const currentSettings = sheetSettings.getRange(2, 1, 1, CONFIG.HEADERS.SETTINGS.length).getValues()[0];
  
  // Isi nilai default jika kosong
  for (let c = 0; c < CONFIG.DEFAULTS.SETTINGS.length; c++) {
    if (currentSettings[c] === '' || currentSettings[c] === null || currentSettings[c] === undefined) {
      if (CONFIG.DEFAULTS.SETTINGS[c] !== '') {
        sheetSettings.getRange(2, c + 1).setValue(CONFIG.DEFAULTS.SETTINGS[c]);
      }
    }
  }

  // 2. Setup USERS
  const sheetUsers = getOrCreateSheet(ss, CONFIG.SHEET.USERS, CONFIG.HEADERS.USERS);
  // Tambah user dummy jika masih kosong
  if (sheetUsers.getLastRow() < 2) {
    sheetUsers.getRange(2, 1, 3, 5).setValues([
      ['1001', 'Budi Santoso', 'Pegawai', '6281234567890', CONFIG.DEFAULT_PIN],
      ['1002', 'Siti Aminah', 'Pegawai', '6289876543210', CONFIG.DEFAULT_PIN],
      ['9999', 'Admin Utama', 'Admin', '6281111111111', CONFIG.DEFAULT_PIN]
    ]);
  }

  // 3. Setup ATTENDANCE_LOG
  getOrCreateSheet(ss, CONFIG.SHEET.LOG, CONFIG.HEADERS.LOG);

  // Hapus "Sheet1" bawaan jika ada
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }
  
  SpreadsheetApp.flush();
}

// ==========================================
// AUTENTIKASI & USER
// ==========================================
function loginUser(nip, pin) {
  try {
    const ss = getAppSpreadsheet();
    const uData = ss.getSheetByName(CONFIG.SHEET.USERS).getDataRange().getValues();
    
    const inputNip = String(nip || '').trim();
    const inputPin = String(pin || '').trim();

    for (let i = 1; i < uData.length; i++) {
      const storedNip = String(uData[i][0] || '').trim();
      const storedPin = (uData[i].length > 4 && uData[i][4] !== '') ? String(uData[i][4]).trim() : CONFIG.DEFAULT_PIN;

      if (storedNip === inputNip && storedPin === inputPin) {
        return {
          success: true,
          user: {
            nip: storedNip,
            nama: String(uData[i][1] || '').trim(),
            role: String(uData[i][2] || '').trim(),
            noWa: String(uData[i][3] || '').trim()
          }
        };
      }
    }
    return { success: false, message: 'NIP atau PIN yang Anda masukkan salah!' };
  } catch (err) {
    return { success: false, message: `Terjadi kesalahan sistem: ${err.message}` };
  }
}

function addUser(nip, nama, role, noWa, pin) {
  try {
    const sheet = getAppSpreadsheet().getSheetByName(CONFIG.SHEET.USERS);
    const uData = sheet.getDataRange().getValues();
    
    const checkNip = String(nip).trim();
    const exists = uData.some((row, index) => index > 0 && String(row[0]).trim() === checkNip);
    
    if (exists) return { success: false, message: 'NIP sudah terdaftar di sistem!' };
    
    sheet.appendRow([nip, nama, role, noWa, pin || CONFIG.DEFAULT_PIN]);
    return { success: true, message: 'Pegawai baru berhasil ditambahkan!' };
  } catch(e) {
    return { success: false, message: `Gagal menambah pegawai: ${e.message}` };
  }
}

// ==========================================
// PENGATURAN KANTOR (SETTINGS)
// ==========================================
function getInitialData() {
  const ss = getAppSpreadsheet();
  const sData = ss.getSheetByName(CONFIG.SHEET.SETTINGS).getDataRange().getValues()[1]; // Ambil baris ke-2
  
  return {
    settings: {
      lat: Number(sData[0]) || -6.175392,
      lng: Number(sData[1]) || 106.827153,
      radius: Number(sData[2]) || 100,
      checkInStart: formatClockSetting(sData[4], '06:00'),
      checkInEnd: formatClockSetting(sData[5], '10:00'),
      checkOutStart: formatClockSetting(sData[6], '14:00'),
      checkOutEnd: formatClockSetting(sData[7], '23:59')
    }
  };
}

function updateSettings(lat, lng, radius, checkInStart, checkInEnd, checkOutStart, checkOutEnd) {
  try {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const timeValues = [checkInStart, checkInEnd, checkOutStart, checkOutEnd];
    
    if (!Number.isFinite(Number(radius)) || Number(radius) <= 0 || 
        timeValues.some(val => !timeRegex.test(String(val || ''))) || 
        checkInStart > checkInEnd || checkOutStart > checkOutEnd) {
      return { success: false, message: 'Radius atau rentang jam presensi tidak valid.' };
    }

    const sheet = getAppSpreadsheet().getSheetByName(CONFIG.SHEET.SETTINGS);
    sheet.getRange(2, 1, 1, 3).setValues([[Number(lat), Number(lng), Number(radius)]]);
    sheet.getRange(2, 5, 1, 4).setValues([[String(checkInStart), String(checkInEnd), String(checkOutStart), String(checkOutEnd)]]);
    
    return { success: true, message: 'Pengaturan Geofencing Kantor Berhasil Diperbarui!' };
  } catch(e) {
    return { success: false, message: `Gagal menyimpan pengaturan: ${e.message}` };
  }
}

// ==========================================
// CORE: PRESENSI LOGIC
// ==========================================
function submitAttendance(payload) {
  const ss = getAppSpreadsheet();
  const settings = getInitialData().settings;
  const timezone = Session.getScriptTimeZone();
  const nowDate = new Date();
  
  const now = Utilities.formatDate(nowDate, timezone, "yyyy-MM-dd HH:mm:ss");
  const today = now.substring(0, 10);
  const currentTime = now.substring(11, 16);
  
  const isCheckIn = payload.tipe === 'MASUK';
  const isCheckOut = payload.tipe === 'PULANG';

  if (!isCheckIn && !isCheckOut) return { success: false, message: 'Tipe presensi tidak valid.' };

  // 1. Validasi Jam Presensi
  const allowedStart = isCheckIn ? settings.checkInStart : settings.checkOutStart;
  const allowedEnd = isCheckIn ? settings.checkInEnd : settings.checkOutEnd;
  
  if (currentTime < allowedStart || currentTime > allowedEnd) {
    return { success: false, message: `Presensi ${payload.tipe} hanya aktif pukul ${allowedStart} sampai ${allowedEnd}.` };
  }
  
  // 2. Validasi Jarak Geofence
  const distance = calculateDistance(payload.lat, payload.lng, settings.lat, settings.lng);
  const isWithinRadius = distance <= settings.radius;
  const status = isWithinRadius ? 'BERHASIL' : 'DITOLAK (Luar Radius)';

  if (!isWithinRadius) {
    return { success: false, message: `Absensi Ditolak! Anda berada ${Math.round(distance)} meter dari kantor (Batas Toleransi: ${settings.radius}m).` };
  }

  // 3. Validasi Duplikasi & Cek Jam Masuk untuk absen pulang
  const sheetLog = ss.getSheetByName(CONFIG.SHEET.LOG);
  const logData = sheetLog.getDataRange().getValues();
  let checkInDate = null;

  for (let i = logData.length - 1; i >= 1; i--) {
    const logTimeStr = (logData[i][0] instanceof Date) 
      ? Utilities.formatDate(logData[i][0], timezone, "yyyy-MM-dd HH:mm:ss") 
      : String(logData[i][0]);
      
    if (String(logData[i][1]) !== String(payload.nip) || !logTimeStr.startsWith(today) || logData[i][4] !== 'BERHASIL') continue;
    
    // Cegah absen tipe yang sama 2x sehari
    if (logData[i][3] === payload.tipe) {
      return { success: false, message: `Presensi ${payload.tipe} hari ini sudah tercatat.` };
    }
    
    // Cari absen MASUK jika tipe saat ini adalah PULANG
    if (isCheckOut && logData[i][3] === 'MASUK') {
      checkInDate = (logData[i][0] instanceof Date) ? logData[i][0] : Utilities.parseDate(logTimeStr, timezone, "yyyy-MM-dd HH:mm:ss");
      break;
    }
  }

  if (isCheckOut && !checkInDate) {
    return { success: false, message: 'Absen masuk yang berhasil belum ditemukan untuk hari ini.' };
  }

  // 4. Kalkulasi Durasi Kerja & Transport
  let durationHours = '';
  let transport = 0;
  if (isCheckOut) {
    const workedMinutes = Math.floor((nowDate.getTime() - checkInDate.getTime()) / 60000);
    if (workedMinutes < 0) return { success: false, message: 'Waktu absen pulang tidak valid.' };
    
    durationHours = Math.round((workedMinutes / 60) * 100) / 100;
    if (workedMinutes >= (8 * 60)) transport = 150000; // Transport jika kerja >= 8 jam
  }

  // 5. Simpan Foto & Catat ke Sheets
  const photoUrl = saveImageToDrive(payload.imageBase64, `${payload.nip}_${nowDate.getTime()}.jpg`);
  sheetLog.appendRow([now, payload.nip, payload.nama, payload.tipe, status, Math.round(distance), payload.lat, payload.lng, photoUrl, durationHours, transport]);

  // 6. Kirim Notifikasi WhatsApp
  const waToken = PropertiesService.getScriptProperties().getProperty('FONNTE_TOKEN');
  let waSent = false;
  
  if (payload.noWa && waToken) {
    const msg = `*NOTIFIKASI ABSENSI PEGAWAI*\n\n` +
                `Nama: ${payload.nama}\n` +
                `NIP: ${payload.nip}\n` +
                `Tipe: ${payload.tipe}\n` +
                `Waktu: ${now}\n` +
                `Jarak: ${Math.round(distance)} Meter\n` +
                (isCheckOut ? `Durasi kerja: ${durationHours} jam\nTransport: Rp${transport.toLocaleString('id-ID')}\n` : '') +
                `Status: ✅ BERHASIL`;
    waSent = sendWhatsAppNotification(payload.noWa, msg, waToken);
  }

  // 7. Response Handler
  let responseMsg = `Absensi ${payload.tipe} berhasil dicatat!`;
  if (isCheckOut) {
    responseMsg += ` Durasi kerja ${durationHours} jam. ` + (transport ? `Transport Rp${transport.toLocaleString('id-ID')} diberikan.` : '(Belum memenuhi 8 jam untuk transport).');
  }
  
  return {
    success: true,
    message: responseMsg,
    distance: Math.round(distance),
    durationHours: durationHours,
    transport: transport,
    waSent: waSent
  };
}

// ==========================================
// REPORT & DASHBOARD
// ==========================================
function getAttendanceLogs(filterDate, filterMonth, nipFilter) {
  const data = getAppSpreadsheet().getSheetByName(CONFIG.SHEET.LOG).getDataRange().getValues();
  const timezone = Session.getScriptTimeZone();
  const logs = [];

  for (let i = 1; i < data.length; i++) {
    const rowTime = data[i][0];
    const formattedTime = (rowTime instanceof Date) ? Utilities.formatDate(rowTime, timezone, "yyyy-MM-dd HH:mm:ss") : String(rowTime);
    const rowNip = String(data[i][1]);

    const matchDate = !filterDate || formattedTime.startsWith(filterDate);
    const matchMonth = !filterMonth || formattedTime.startsWith(filterMonth);
    const matchNip = !nipFilter || rowNip === String(nipFilter);

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
        foto: data[i][8],
        durasi: data[i][9] || '',
        transport: data[i][10] || 0
      });
    }
  }
  return logs.reverse(); // Urutan terbaru di atas
}

function getAdminDashboardStats() {
  const ss = getAppSpreadsheet();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  const totalPegawai = ss.getSheetByName(CONFIG.SHEET.USERS).getLastRow() - 1;
  const logData = ss.getSheetByName(CONFIG.SHEET.LOG).getDataRange().getValues();
  
  let totalAbsenHariIni = 0;
  let totalBerhasil = 0;
  let totalDitolak = 0;

  for (let i = 1; i < logData.length; i++) {
    const timeStr = (logData[i][0] instanceof Date) ? Utilities.formatDate(logData[i][0], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(logData[i][0]);
    if (timeStr.startsWith(today)) {
      totalAbsenHariIni++;
      if (logData[i][4] === 'BERHASIL') totalBerhasil++;
      else totalDitolak++;
    }
  }

  return {
    totalPegawai: Math.max(totalPegawai, 0),
    totalAbsenHariIni,
    totalBerhasil,
    totalDitolak
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Formula Haversine (Jarak Koordinat dalam Meter)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius Bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format format cell time dari Sheets (menangani format Date/Desimal)
function formatClockSetting(value, fallback) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60);
    return ('0' + Math.floor(totalMinutes / 60)).slice(-2) + ':' + ('0' + (totalMinutes % 60)).slice(-2);
  }
  const text = String(value || fallback).trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
}

// Simpan File ke Google Drive
function saveImageToDrive(base64Data, filename) {
  const folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const contentType = base64Data.substring(5, base64Data.indexOf(';'));
  const bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf('base64,') + 7));
  const blob = Utilities.newBlob(bytes, contentType, filename);
  const file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// Kirim WA via Fonnte
function sendWhatsAppNotification(targetPhone, message, token) {
  try {
    const response = UrlFetchApp.fetch('https://api.fonnte.com/send', {
      method: 'post',
      headers: { 'Authorization': token },
      payload: { target: targetPhone, message: message },
      muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());
    return response.getResponseCode() >= 200 && response.getResponseCode() < 300 && (String(result.status) === 'true');
  } catch(e) {
    Logger.log(`WA Failed: ${e.message}`);
    return false;
  }
}

// Alias untuk repairDatabase (kini di-handle penuh oleh setupDatabase secara non-destruktif)
function repairDatabase() {
  setupDatabase();
  Logger.log('Perbaikan database selesai.');
}