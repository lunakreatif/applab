# AppLab — Luna Kreatif uygulama vitrini

<https://applab.lunakreatif.com>

Luna Kreatif'in mobil uygulamalarının tanıtım sayfaları. Her uygulama için üç
sayfa üretilir:

```
/                       kategorilere göre uygulama listesi
/<slug>/                tanıtım + ekran görüntüleri
/<slug>/gizlilik/       gizlilik politikası   ← App Store / Play zorunlu kılıyor
/<slug>/destek/         destek + SSS          ← App Store zorunlu kılıyor
```

Gizlilik ve destek sayfaları **süs değil**: App Store Connect ve Play Console bu
iki adresi zorunlu alan olarak istiyor ve uygulamayı indirmemiş birinin de
açabilmesi gerekiyor. Uygulama içine gömmek kabul edilmiyor.

## Yeni uygulama ekleme

1. `data/apps.json` içindeki `apps` dizisine bir kayıt ekle. Alan sırası
   `kokten` kaydındaki gibi olsun; `slug` klasör adı olacak.
2. Görselleri `assets/<slug>/` altına koy — simge 256×256 PNG, ekran görüntüleri
   uzun kenarı ~1300 piksel (cihaz görüntüsünün yarısı yeter, dosya küçülür).
3. Kategori yoksa `categories` dizisine ekle. Boş kategori ana sayfada
   görünmez, o yüzden sırayı önceden kurmak sorun değil.
4. Üret ve gönder:

```bash
node build.mjs
git add -A && git commit -m "Yeni uygulama: <ad>" && git push
```

## Neden üretici var, elle HTML yok

Her uygulama üç sayfa demek. Elle çoğaltmak, ikinci uygulamada gizlilik metnini
bir sayfada güncelleyip diğerini unutmakla biter. Tek kaynak `data/apps.json`.

`build.mjs` bağımlılıksızdır — yalnızca Node yerleşikleri. Üretilen HTML **depoya
commit edilir**, böylece GitHub Pages hiçbir Actions kurulumu olmadan yayınlar.

## Yerelde bakmak

```bash
node build.mjs && python3 -m http.server 8099
# http://127.0.0.1:8099
```

## Alan adı

`CNAME` dosyası `build.mjs` tarafından `data/apps.json` → `site.url`'den
üretiliyor. DNS tarafında gereken kayıt:

```
applab   CNAME   lunakreatif.github.io.
```

## Dikkat

- `site.contactEmail` mağaza formlarında **destek adresi** olarak geçiyor;
  değiştirirsen App Store Connect'teki Support URL/e-posta ile tutarlı kalsın.
- Gizlilik metni uygulamanın gerçekten topladığı veriyle **birebir** aynı olmalı.
  Kökten'de bu metin, uygulamanın `PrivacyInfo.xcprivacy` beyanıyla eşleşiyor;
  analytics ya da çökme raporlama eklenirse **üçü birden** güncellenmeli
  (manifest, App Privacy formu, bu sayfa).
