// ==============================================
// GOOGLE APPS SCRIPT - SİPARİŞ KAYIT SİSTEMİ
// + TELEGRAM BİLDİRİM
// ==============================================
//
// Bu kodu Google Apps Script'e yapıştırın.
// 
// ADIMLAR:
// 1. https://script.google.com adresine gidin
// 2. Mevcut projenizi açın (veya yeni oluşturun)
// 3. Bu kodu yapıştırın
// 4. "Dağıt" > "Dağıtımları yönet" > sağ üstteki kalem ikonu
// 5. Sürümü "Yeni sürüm" olarak seçin ve "Dağıt" tıklayın
//
// NOT: Telegram bildirimi için ek izin gerekmez,
//      UrlFetchApp zaten Apps Script'te mevcuttur.
// ==============================================

// ===== TELEGRAM AYARLARI =====
var TELEGRAM_BOT_TOKEN = '8990575008:AAEJOPv_JZgK0WNK3UC-rzhZbuYHFM4oFMY';
var TELEGRAM_CHAT_ID = '5465463307';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Tarih',
        'Ad Soyad',
        'Telefon',
        'İl',
        'İlçe',
        'Adres',
        'Ürün',
        'Paket',
        'Adet',
        'Toplam Fiyat',
        'Durum'
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#7c3aed');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    
    sheet.appendRow([
      data.date || new Date().toLocaleString('tr-TR'),
      data.name || '',
      data.phone || '',
      data.city || '',
      data.district || '',
      data.address || '',
      data.product || 'LED Matrix Panel 12×60cm',
      data.package || '',
      data.quantity || '1',
      data.totalPrice || '',
      'Yeni'
    ]);
    
    for (var i = 1; i <= 9; i++) {
      sheet.autoResizeColumn(i);
    }

    // ===== TELEGRAM BİLDİRİM GÖNDER =====
    sendTelegramNotification(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'Sipariş kaydedildi' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'Sipariş API çalışıyor' 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSpreadsheet() {
  var fileName = 'Siparişler - LED Matrix Panel';
  var files = DriveApp.getFilesByName(fileName);
  
  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  
  var ss = SpreadsheetApp.create(fileName);
  return ss;
}

// ===== TELEGRAM BİLDİRİM FONKSİYONU =====
function sendTelegramNotification(data) {
  try {
    var message = '🛒 *YENİ SİPARİŞ!*\n'
      + '━━━━━━━━━━━━━━━━\n'
      + '👤 *Ad Soyad:* ' + (data.name || '-') + '\n'
      + '📞 *Telefon:* ' + (data.phone || '-') + '\n'
      + '📍 *İl / İlçe:* ' + (data.city || '-') + ' / ' + (data.district || '-') + '\n'
      + '🏠 *Adres:* ' + (data.address || '-') + '\n'
      + '━━━━━━━━━━━━━━━━\n'
      + '📦 *Paket:* ' + (data.package || '-') + '\n'
      + '💰 *Toplam:* ' + (data.totalPrice || '-') + '\n'
      + '🕐 *Tarih:* ' + (data.date || new Date().toLocaleString('tr-TR')) + '\n'
      + '━━━━━━━━━━━━━━━━';

    var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
    
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    // Telegram hatası sipariş kaydını engellemez
    Logger.log('Telegram bildirim hatası: ' + err.toString());
  }
}
