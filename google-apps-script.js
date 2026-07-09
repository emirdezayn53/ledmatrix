// ==============================================
// GOOGLE APPS SCRIPT - SİPARİŞ KAYIT SİSTEMİ
// ==============================================
//
// Bu kodu Google Apps Script'e yapıştırın.
// 
// ADIMLAR:
// 1. https://script.google.com adresine gidin
// 2. "Yeni Proje" oluşturun
// 3. Bu kodu yapıştırın
// 4. "Dağıt" > "Yeni dağıtım" seçin
// 5. Tür olarak "Web uygulaması" seçin
// 6. "Şu kişi olarak yürüt" = "Ben"
// 7. "Erişimi olan kişiler" = "Herkes" 
// 8. "Dağıt" butonuna tıklayın
// 9. URL'yi kopyalayıp script.js dosyasındaki 
//    GOOGLE_SCRIPT_URL değişkenine yapıştırın
//
// NOT: İlk çalıştırmada Google izin isteyecektir,
//      "Gelişmiş" > "Projeye git" ile izin verin.
// ==============================================

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
