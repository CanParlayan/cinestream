# Video Oynatma Sorunları - Çözüm Rehberi

## 🎬 Video.js Kullanımı

Bu uygulama artık **Video.js** kullanıyor - diğer IPTV player'lar gibi profesyonel ve güvenilir bir video oynatıcı.

## 🔍 Sorun Giderme

### 1. "Loading video..." Yazısı Kalıyor

**Nedenleri:**
- Stream URL'si yanlış olabilir
- Container extension yanlış ayarlanmış olabilir
- CORS sorunu
- Sunucu erişilemiyor

**Çözümler:**

1. **Tarayıcı Konsolunu Kontrol Edin:**
   - F12 tuşuna basın
   - Console sekmesine gidin
   - Kırmızı hatalar var mı bakın
   - "Stream URL:" yazan satırı bulun ve URL'nin doğru olduğunu kontrol edin

2. **URL Formatını Kontrol Edin:**
   ```
   Doğru: http://example.com:8080
   Yanlış: http://example.com:8080/
   Yanlış: http://example.com:8080/player_api.php
   ```

3. **Farklı Container Extension Deneyin:**
   - Xtream API'nizde container_extension bilgisini kontrol edin
   - Genellikle `mp4` veya `m3u8` olur
   - Video.js her ikisini de destekler

### 2. CORS Hatası

**Hata Mesajı:**
```
Access to fetch at 'http://...' has been blocked by CORS policy
```

**Çözüm:**
- Bu sunucu tarafında bir sorundur
- Xtream sunucunuzun CORS ayarlarını kontrol edin
- Veya farklı bir tarayıcı deneyin (Chrome önerilir)

### 3. Format Uyumsuzluğu

**Video.js Desteklenen Formatlar:**
- ✅ MP4 (H.264)
- ✅ M3U8 (HLS)
- ✅ WebM
- ✅ OGG

**Çözüm:**
- `src/hooks/usePlayer.js` dosyasını açın
- `sources` kısmında `type` değerini kontrol edin:
  ```javascript
  sources: [{
    src: streamUrl,
    type: streamUrl.includes('.m3u8') 
      ? 'application/x-mpegURL'  // HLS için
      : 'video/mp4'               // MP4 için
  }]
  ```

### 4. Stream URL'sini Manuel Test Etme

**Konsola yazın:**
```javascript
// Stream ID'nizi yazın
const streamId = 12345;

// API bilgileriniz
const server = 'http://your-server.com:8080';
const username = 'your-username';
const password = 'your-password';

// URL'yi oluştur
const url = `${server}/movie/${username}/${password}/${streamId}.mp4`;
console.log('Test URL:', url);

// Tarayıcıda yeni sekmede açın
window.open(url);
```

### 5. Debug Modu Açma

**usePlayer.js dosyasında console.log'ları aktif edin:**

Dosyada zaten var olan bu satırlar size yardımcı olacak:
```javascript
console.log('Stream URL:', streamUrl);
console.log('Video.js player ready');
console.log('Resumed from:', savedProgress.currentTime);
```

Hata için:
```javascript
player.on('error', () => {
  const error = player.error();
  console.error('Video.js error:', error);
  console.error('Error code:', error?.code);
  console.error('Error message:', error?.message);
});
```

### 6. Yaygın Hata Kodları

Video.js hata kodları:
- **1 (MEDIA_ERR_ABORTED)** - İndirme iptal edildi
- **2 (MEDIA_ERR_NETWORK)** - Ağ hatası
- **3 (MEDIA_ERR_DECODE)** - Video decode edilemiyor
- **4 (MEDIA_ERR_SRC_NOT_SUPPORTED)** - Format desteklenmiyor

### 7. Container Extension Ayarı

Eğer filmler yüklenmiyor ise, `src/services/xtreamApi.js` dosyasında şunu deneyin:

```javascript
getStreamUrl(streamId, containerExtension = 'm3u8') {  // mp4 yerine m3u8 deneyin
  if (!this.isAuthenticated()) {
    throw new Error('API credentials not set');
  }

  return `${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.${containerExtension}`;
}
```

### 8. Video.js Versiyonunu Kontrol

`package.json` dosyasında:
```json
"video.js": "^8.10.0"
```

Eğer sorun devam ederse:
```bash
npm install video.js@latest
```

## 🔧 Gelişmiş Sorun Giderme

### Network Tab'ı İzleme

1. F12 > Network sekmesi
2. Bir film açın
3. `.m3u8` veya `.mp4` uzantılı isteklere bakın
4. Status code kontrol edin:
   - 200 = Başarılı
   - 404 = Bulunamadı (yanlış URL)
   - 403 = Yetkisiz (kimlik doğrulama sorunu)
   - 500 = Sunucu hatası

### Cache Temizleme

```javascript
// Tarayıcı konsolunda:
localStorage.clear();
location.reload();
```

### Farklı Stream URL Formatı Deneme

Bazı Xtream sunucuları farklı formatlar kullanır:

```javascript
// Varsayılan format
http://server:8080/movie/username/password/12345.mp4

// Alternatif format (bazı sunucularda)
http://server:8080/live/username/password/12345.m3u8
```

## 📞 Yardım

Sorun devam ederse:

1. **Tarayıcı konsolundan tüm hataları kopyalayın**
2. **Network tab'dan stream URL'sini kopyalayın**
3. **Stream URL'sini tarayıcıda direkt açmayı deneyin**
4. **Farklı bir filmi deneyin**

## ✅ Başarılı Test

Video düzgün çalışıyorsa konsolda şunları görmelisiniz:

```
Stream URL: http://your-server.com:8080/movie/user/pass/12345.mp4
Video.js player ready
Resumed from: 125.4
```

---

**Video.js diğer IPTV player'larla uyumludur ve daha güvenilirdir!** 🎬
