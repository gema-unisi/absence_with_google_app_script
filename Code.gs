/**
 * APLIKASI PRESENSI PEGAWAI BERBASIS LOKASI & SELFIE (V2 - PROFESSIONAL)
 * Backend Google Apps Script
 */

function doGet(e) {
  setupDatabase();
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Presensi Mobile Premium")
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Inisialisasi Database Google Sheets
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet SETTINGS
  var sheetSettings = ss.getSheetByName("SETTINGS");
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet("SETTINGS");
    sheetSettings.appendRow([
      "Office Lat",
      "Office Lng",
      "Radius (Meter)",
      "Legacy WA Token (unused)",
      "Masuk Mulai",
      "Masuk Selesai",
      "Pulang Mulai",
      "Pulang Selesai",
    ]);
    sheetSettings.appendRow([
      0.573993,
      101.423744,
      100,
      "",
      "06:00",
      "10:00",
      "14:00",
      "23:59",
    ]);
  } else {
    sheetSettings.getRange(1, 4).setValue("Legacy WA Token (unused)");
    sheetSettings.getRange(2, 4).clearContent();
    sheetSettings
      .getRange(1, 5, 1, 4)
      .setValues([
        ["Masuk Mulai", "Masuk Selesai", "Pulang Mulai", "Pulang Selesai"],
      ]);
    var currentSchedule = sheetSettings.getRange(2, 5, 1, 4).getValues()[0];
    var defaultSchedule = ["06:00", "10:00", "14:00", "23:59"];
    for (
      var settingIndex = 0;
      settingIndex < defaultSchedule.length;
      settingIndex++
    ) {
      if (!currentSchedule[settingIndex]) {
        sheetSettings
          .getRange(2, settingIndex + 5)
          .setValue(defaultSchedule[settingIndex]);
      }
    }
  }

  // 2. Sheet USERS
  var sheetUsers = ss.getSheetByName("USERS");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("USERS");
    sheetUsers.appendRow(["NIP", "Nama", "Role", "No WA", "PIN"]);
    sheetUsers.appendRow([
      "1001",
      "Budi Santoso",
      "Pegawai",
      "6281234567890",
      "1234",
    ]);
    sheetUsers.appendRow([
      "1002",
      "Siti Aminah",
      "Pegawai",
      "6289876543210",
      "1234",
    ]);
    sheetUsers.appendRow([
      "9999",
      "Admin Utama",
      "Admin",
      "6281111111111",
      "1234",
    ]);
  } else {
    // Pastikan kolom PIN ada jika sheet sudah dibuat sebelumnya
    var lastCol = sheetUsers.getLastColumn();
    var headers = sheetUsers
      .getRange(1, 1, 1, Math.max(lastCol, 1))
      .getValues()[0];
    if (headers.length < 5 || headers[4] !== "PIN") {
      sheetUsers.getRange(1, 5).setValue("PIN");
      var lastRow = sheetUsers.getLastRow();
      if (lastRow > 1) {
        for (var r = 2; r <= lastRow; r++) {
          if (!sheetUsers.getRange(r, 5).getValue()) {
            sheetUsers.getRange(r, 5).setValue("1234");
          }
        }
      }
    }
  }

  // 3. Sheet ATTENDANCE_LOG
  var sheetLog = ss.getSheetByName("ATTENDANCE_LOG");
  if (!sheetLog) {
    sheetLog = ss.insertSheet("ATTENDANCE_LOG");
    sheetLog.appendRow([
      "Timestamp",
      "NIP",
      "Nama",
      "Tipe",
      "Status",
      "Jarak (m)",
      "Latitude",
      "Longitude",
      "Foto URL",
      "Durasi Kerja (Jam)",
      "Transport (Rp)",
    ]);
  } else {
    sheetLog
      .getRange(1, 10, 1, 2)
      .setValues([["Durasi Kerja (Jam)", "Transport (Rp)"]]);
  }

  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }
}

// System Auth Login
function loginUser(nip, pin) {
  try {
    setupDatabase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var uData = ss.getSheetByName("USERS").getDataRange().getValues();

    var inputNip = String(nip || "").trim();
    var inputPin = String(pin || "").trim();

    for (var i = 1; i < uData.length; i++) {
      var storedNip = String(uData[i][0] || "").trim();
      var storedName = String(uData[i][1] || "").trim();
      var storedRole = String(uData[i][2] || "").trim();
      var storedWa = String(uData[i][3] || "").trim();
      var storedPin =
        uData[i].length > 4 && uData[i][4] !== ""
          ? String(uData[i][4]).trim()
          : "1234";

      if (storedNip === inputNip && storedPin === inputPin) {
        return {
          success: true,
          user: {
            nip: storedNip,
            nama: storedName,
            role: storedRole,
            noWa: storedWa,
          },
        };
      }
    }
    return {
      success: false,
      message: "NIP atau PIN yang Anda masukkan salah!",
    };
  } catch (err) {
    return {
      success: false,
      message: "Terjadi kesalahan sistem: " + err.toString(),
    };
  }
}

// Ambil Data Inisialisasi Pengaturan Kantor
function getInitialData() {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sData = ss.getSheetByName("SETTINGS").getDataRange().getValues();
  var settings = {
    lat: Number(sData[1][0]) || -6.175392,
    lng: Number(sData[1][1]) || 106.827153,
    radius: Number(sData[1][2]) || 100,
    checkInStart: formatClockSetting(sData[1][4], "06:00"),
    checkInEnd: formatClockSetting(sData[1][5], "10:00"),
    checkOutStart: formatClockSetting(sData[1][6], "14:00"),
    checkOutEnd: formatClockSetting(sData[1][7], "23:59"),
  };

  return { settings: settings };
}

// Update Pengaturan Geofence Kantor oleh Admin
function updateSettings(
  lat,
  lng,
  radius,
  checkInStart,
  checkInEnd,
  checkOutStart,
  checkOutEnd,
) {
  try {
    var timeValues = [checkInStart, checkInEnd, checkOutStart, checkOutEnd];
    if (
      !Number.isFinite(Number(radius)) ||
      Number(radius) <= 0 ||
      timeValues.some(function (value) {
        return !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
      }) ||
      checkInStart > checkInEnd ||
      checkOutStart > checkOutEnd
    ) {
      return {
        success: false,
        message: "Radius dan rentang jam presensi tidak valid.",
      };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("SETTINGS");
    sheet
      .getRange(2, 1, 1, 3)
      .setValues([[Number(lat), Number(lng), Number(radius)]]);
    sheet
      .getRange(2, 5, 1, 4)
      .setValues([
        [
          String(checkInStart),
          String(checkInEnd),
          String(checkOutStart),
          String(checkOutEnd),
        ],
      ]);
    return {
      success: true,
      message: "Pengaturan Geofencing Kantor Berhasil Diperbarui!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Gagal menyimpan pengaturan: " + e.toString(),
    };
  }
}

// Tambah Pegawai Baru
function addUser(nip, nama, role, noWa, pin) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("USERS");
    var uData = sheet.getDataRange().getValues();

    for (var i = 1; i < uData.length; i++) {
      if (String(uData[i][0]).trim() === String(nip).trim()) {
        return { success: false, message: "NIP sudah terdaftar di sistem!" };
      }
    }

    sheet.appendRow([nip, nama, role, noWa, pin || "1234"]);
    return { success: true, message: "Pegawai baru berhasil ditambahkan!" };
  } catch (e) {
    return {
      success: false,
      message: "Gagal menambah pegawai: " + e.toString(),
    };
  }
}

// Simpan Absensi
function submitAttendance(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = getInitialData().settings;
  var nowDate = new Date();
  var now = Utilities.formatDate(
    nowDate,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss",
  );
  var today = now.substring(0, 10);
  var currentTime = now.substring(11, 16);
  var isCheckIn = payload.tipe === "MASUK";
  var isCheckOut = payload.tipe === "PULANG";

  if (!isCheckIn && !isCheckOut) {
    return { success: false, message: "Tipe presensi tidak valid." };
  }

  var allowedStart = isCheckIn ? settings.checkInStart : settings.checkOutStart;
  var allowedEnd = isCheckIn ? settings.checkInEnd : settings.checkOutEnd;
  if (currentTime < allowedStart || currentTime > allowedEnd) {
    return {
      success: false,
      message:
        "Presensi " +
        payload.tipe +
        " hanya aktif pukul " +
        allowedStart +
        " sampai " +
        allowedEnd +
        ".",
    };
  }

  var distance = calculateDistance(
    payload.lat,
    payload.lng,
    settings.lat,
    settings.lng,
  );
  var isWithinRadius = distance <= settings.radius;
  var status = isWithinRadius ? "BERHASIL" : "DITOLAK (Luar Radius)";

  if (!isWithinRadius) {
    return {
      success: false,
      message:
        "Absensi Ditolak! Anda berada " +
        Math.round(distance) +
        " meter dari kantor (Batas Toleransi: " +
        settings.radius +
        "m).",
    };
  }

  var sheetLog = ss.getSheetByName("ATTENDANCE_LOG");
  var logData = sheetLog.getDataRange().getValues();
  var checkInDate = null;
  for (var logIndex = logData.length - 1; logIndex >= 1; logIndex--) {
    var logTime =
      logData[logIndex][0] instanceof Date
        ? Utilities.formatDate(
            logData[logIndex][0],
            Session.getScriptTimeZone(),
            "yyyy-MM-dd HH:mm:ss",
          )
        : String(logData[logIndex][0]);
    if (
      String(logData[logIndex][1]) !== String(payload.nip) ||
      !logTime.startsWith(today) ||
      logData[logIndex][4] !== "BERHASIL"
    )
      continue;
    if (logData[logIndex][3] === payload.tipe) {
      return {
        success: false,
        message: "Presensi " + payload.tipe + " hari ini sudah tercatat.",
      };
    }
    if (isCheckOut && logData[logIndex][3] === "MASUK") {
      checkInDate =
        logData[logIndex][0] instanceof Date
          ? logData[logIndex][0]
          : Utilities.parseDate(
              logTime,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd HH:mm:ss",
            );
      break;
    }
  }

  if (isCheckOut && !checkInDate) {
    return {
      success: false,
      message: "Absen masuk yang berhasil belum ditemukan untuk hari ini.",
    };
  }

  var durationHours = "";
  var transport = 0;
  if (isCheckOut) {
    var workedMinutes = Math.floor(
      (nowDate.getTime() - checkInDate.getTime()) / 60000,
    );
    if (workedMinutes < 0)
      return { success: false, message: "Waktu absen pulang tidak valid." };
    durationHours = Math.round((workedMinutes / 60) * 100) / 100;
    if (workedMinutes >= 8 * 60) transport = 150000;
  }

  var photoUrl = saveImageToDrive(
    payload.imageBase64,
    payload.nip + "_" + nowDate.getTime() + ".jpg",
  );
  sheetLog.appendRow([
    now,
    payload.nip,
    payload.nama,
    payload.tipe,
    status,
    Math.round(distance),
    payload.lat,
    payload.lng,
    photoUrl,
    durationHours,
    transport,
  ]);

  var waToken =
    PropertiesService.getScriptProperties().getProperty("FONNTE_TOKEN");
  var waSent = false;
  if (payload.noWa && waToken) {
    var msg =
      "NOTIFIKASI ABSENSI PEGAWAI\n\n" +
      "Nama: " +
      payload.nama +
      "\n" +
      "NIP: " +
      payload.nip +
      "\n" +
      "Tipe: " +
      payload.tipe +
      "\n" +
      "Waktu: " +
      now +
      "\n" +
      "Jarak: " +
      Math.round(distance) +
      " Meter\n" +
      (isCheckOut
        ? "Durasi kerja: " +
          durationHours +
          " jam\nTransport: Rp" +
          transport.toLocaleString("id-ID") +
          "\n"
        : "") +
      "Status: BERHASIL";
    waSent = sendWhatsAppNotification(payload.noWa, msg, waToken);
  }

  return {
    success: true,
    message:
      "Absensi " +
      payload.tipe +
      " berhasil dicatat!" +
      (isCheckOut
        ? " Durasi kerja " +
          durationHours +
          " jam; transport Rp" +
          transport.toLocaleString("id-ID") +
          (transport ? " diberikan." : " (belum memenuhi 8 jam).")
        : "") +
      (!waToken
        ? " Token WhatsApp belum dikonfigurasi."
        : !payload.noWa
          ? " Nomor WhatsApp pegawai belum diisi."
          : waSent
            ? " Notifikasi WhatsApp terkirim."
            : " Presensi tercatat, tetapi notifikasi WhatsApp gagal dikirim."),
    distance: Math.round(distance),
    durationHours: durationHours,
    transport: transport,
    waSent: waSent,
  };
}

// Ambil Laporan Log Absensi (Support Filter NIP, Tanggal, Bulan)
function getAttendanceLogs(filterDate, filterMonth, nipFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLog = ss.getSheetByName("ATTENDANCE_LOG");
  var data = sheetLog.getDataRange().getValues();
  var logs = [];

  for (var i = 1; i < data.length; i++) {
    var rowTime = data[i][0];
    var formattedTime =
      rowTime instanceof Date
        ? Utilities.formatDate(
            rowTime,
            Session.getScriptTimeZone(),
            "yyyy-MM-dd HH:mm:ss",
          )
        : rowTime;
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
        foto: data[i][8],
        durasi: data[i][9] || "",
        transport: data[i][10] || 0,
      });
    }
  }
  return logs.reverse();
}

// Ambil Statistik Ringkas Dashboard Admin
function getAdminDashboardStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );

  var totalPegawai = ss.getSheetByName("USERS").getLastRow() - 1;
  var logData = ss.getSheetByName("ATTENDANCE_LOG").getDataRange().getValues();

  var totalAbsenHariIni = 0;
  var totalBerhasil = 0;
  var totalDitolak = 0;

  for (var i = 1; i < logData.length; i++) {
    var timeStr =
      logData[i][0] instanceof Date
        ? Utilities.formatDate(
            logData[i][0],
            Session.getScriptTimeZone(),
            "yyyy-MM-dd",
          )
        : logData[i][0];
    if (timeStr.startsWith(today)) {
      totalAbsenHariIni++;
      if (logData[i][4] === "BERHASIL") totalBerhasil++;
      else totalDitolak++;
    }
  }

  return {
    totalPegawai: totalPegawai > 0 ? totalPegawai : 0,
    totalAbsenHariIni: totalAbsenHariIni,
    totalBerhasil: totalBerhasil,
    totalDitolak: totalDitolak,
  };
}

// Formula Haversine (Hitung Jarak GPS)
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatClockSetting(value, fallback) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  if (typeof value === "number" && value >= 0 && value < 1) {
    var totalMinutes = Math.round(value * 24 * 60);
    return (
      ("0" + Math.floor(totalMinutes / 60)).slice(-2) +
      ":" +
      ("0" + (totalMinutes % 60)).slice(-2)
    );
  }
  var text = String(value || fallback).trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
}

// Simpan Gambar ke Drive
function saveImageToDrive(base64Data, filename) {
  var folderName = "Presensi_Photos_Folder";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var contentType = base64Data.substring(5, base64Data.indexOf(";"));
  var bytes = Utilities.base64Decode(
    base64Data.substr(base64Data.indexOf("base64,") + 7),
  );
  var blob = Utilities.newBlob(bytes, contentType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

// Kirim Notifikasi WA (Fonnte API)
function sendWhatsAppNotification(targetPhone, message, token) {
  try {
    var response = UrlFetchApp.fetch("https://api.fonnte.com/send", {
      method: "post",
      headers: { Authorization: token },
      payload: { target: targetPhone, message: message },
      muteHttpExceptions: true,
    });
    var result = JSON.parse(response.getContentText());
    return (
      response.getResponseCode() >= 200 &&
      response.getResponseCode() < 300 &&
      (result.status === true || result.status === "true")
    );
  } catch (e) {
    Logger.log("WA Failed: " + e.toString());
    return false;
  }
}

/**
 * MEMPERBAIKI DATABASE PRESENSI
 * Mengisi data default yang kosong tanpa menghapus
 * data presensi atau pengaturan yang sudah ada.
 */
function repairDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      "Spreadsheet tidak ditemukan. Pastikan Apps Script terhubung ke Google Sheets.",
    );
  }

  // 1. Perbaiki SETTINGS
  var settings = ss.getSheetByName("SETTINGS");

  if (!settings) {
    settings = ss.insertSheet("SETTINGS");
  }

  var headersSettings = [
    "Office Lat",
    "Office Lng",
    "Radius (Meter)",
    "Legacy WA Token (unused)",
    "Masuk Mulai",
    "Masuk Selesai",
    "Pulang Mulai",
    "Pulang Selesai",
  ];

  settings.getRange(1, 1, 1, 8).setValues([headersSettings]);

  // Isi hanya sel yang kosong; pertahankan nilai yang sudah ada.
  var defaults = [
    0.573993,
    101.423744,
    100,
    "",
    "06:00",
    "10:00",
    "14:00",
    "23:59",
  ];

  var current = settings.getRange(2, 1, 1, 8).getValues()[0];

  for (var c = 0; c < defaults.length; c++) {
    if (current[c] === "" || current[c] === null) {
      if (defaults[c] !== "") {
        settings.getRange(2, c + 1).setValue(defaults[c]);
      }
    }
  }

  // 2. Perbaiki USERS
  var users = ss.getSheetByName("USERS");

  if (!users) {
    users = ss.insertSheet("USERS");
  }

  var headersUsers = ["NIP", "Nama", "Role", "No WA", "PIN"];
  users.getRange(1, 1, 1, 5).setValues([headersUsers]);

  // Tambahkan akun contoh hanya jika belum ada data pegawai.
  if (users.getLastRow() < 2) {
    users.getRange(2, 1, 3, 5).setValues([
      ["1001", "Budi Santoso", "Pegawai", "6281234567890", "1234"],
      ["1002", "Siti Aminah", "Pegawai", "6289876543210", "1234"],
      ["9999", "Admin Utama", "Admin", "6281111111111", "1234"],
    ]);
  }

  // 3. Perbaiki ATTENDANCE_LOG
  var log = ss.getSheetByName("ATTENDANCE_LOG");

  if (!log) {
    log = ss.insertSheet("ATTENDANCE_LOG");
  }

  var headersLog = [
    "Timestamp",
    "NIP",
    "Nama",
    "Tipe",
    "Status",
    "Jarak (m)",
    "Latitude",
    "Longitude",
    "Foto URL",
    "Durasi Kerja (Jam)",
    "Transport (Rp)",
  ];

  log.getRange(1, 1, 1, 11).setValues([headersLog]);

  SpreadsheetApp.flush();

  Logger.log("Perbaikan database selesai.");
  Logger.log("Spreadsheet: " + ss.getUrl());
}
