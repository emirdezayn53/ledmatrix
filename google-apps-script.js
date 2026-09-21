// ==============================================
// GOOGLE APPS SCRIPT - SİPARİŞ KAYIT SİSTEMİ
// + TELEGRAM BİLDİRİM + IP TAKİP + MÜKERRER UYARI
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
// ==============================================

// ===== TELEGRAM AYARLARI =====
var TELEGRAM_BOT_TOKEN = '8990575008:AAEJOPv_JZgK0WNK3UC-rzhZbuYHFM4oFMY';
var TELEGRAM_CHAT_ID = '5465463307';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Başlık satırı yoksa oluştur
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
        'IP Adresi',
        'Durum'
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#7c3aed');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    
    // Mükerrer sipariş kontrolü
    var durum = 'Yeni';
    if (data.isDuplicate === true) {
      durum = '🚨 Şüpheli / Tekrar';
    }
    
    // Satırı ekle
    var newRow = sheet.getLastRow() + 1;
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
      data.ip || 'Bilinmiyor',
      durum
    ]);
    
    // Şüpheli siparişleri kırmızı arka planla işaretle
    if (data.isDuplicate === true) {
      var rowRange = sheet.getRange(newRow, 1, 1, 12);
      rowRange.setBackground('#fce4e4');
      var durumCell = sheet.getRange(newRow, 12);
      durumCell.setFontColor('#c0392b');
      durumCell.setFontWeight('bold');
    }
    
    // Sütunları otomatik genişlet
    for (var i = 1; i <= 12; i++) {
      sheet.autoResizeColumn(i);
    }

    // Telegram bildirimi gönder
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
    var header = (data.isDuplicate === true)
      ? '🚨 *ŞÜPHELİ / TEKRAR SİPARİŞ!*'
      : '🛒 *YENİ SİPARİŞ!*';

    var message = header + '\n'
      + '━━━━━━━━━━━━━━━━\n'
      + '👤 *Ad Soyad:* ' + (data.name || '-') + '\n'
      + '📞 *Telefon:* ' + (data.phone || '-') + '\n'
      + '📍 *İl / İlçe:* ' + (data.city || '-') + ' / ' + (data.district || '-') + '\n'
      + '🏠 *Adres:* ' + (data.address || '-') + '\n'
      + '━━━━━━━━━━━━━━━━\n'
      + '📦 *Paket:* ' + (data.package || '-') + '\n'
      + '💰 *Toplam:* ' + (data.totalPrice || '-') + '\n'
      + '🕐 *Tarih:* ' + (data.date || new Date().toLocaleString('tr-TR')) + '\n'
      + '🌐 *IP:* ' + (data.ip || 'Bilinmiyor') + '\n'
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
    Logger.log('Telegram bildirim hatası: ' + err.toString());
  }
}
