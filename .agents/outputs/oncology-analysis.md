# Onkoloji Veri Seti — Kapsamlı Analiz Raporu

**Tarih:** 15 Mayıs 2026  
**Veri Kaynağı:** Hackathon Onkoloji Veri Seti (1.000 başvuru kaydı, 979 benzersiz hasta)  
**Kapsam:** Medikal Onkoloji ve Radyasyon Onkolojisi Birimleri

---

## Yönetici Özeti

Bu rapor, 1.000 onkoloji başvuru kaydını kapsayan bir hasta veri setinin çok boyutlu analizini sunmaktadır. Analiz; demografik dağılım, departman yükü, tedavi örüntüleri, genetik test kullanımı ve işlem tipi dağılımını ele almaktadır. Veriler, hasta popülasyonunun yaşlı ve erkek ağırlıklı olduğunu, medikal onkolojinin tüm başvuruların neredeyse tamamını karşıladığını ve laboratuvar işlemlerinin klinik yükün büyük bölümünü oluşturduğunu ortaya koymaktadır.

---

## 1. Demografik Profil

### 1.1 Genel Bakış

| Gösterge | Değer |
|---|---|
| Benzersiz Hasta | 979 |
| Toplam Başvuru | 1.000 |
| Ortalama Yaş | 66,1 |
| En Genç Hasta | <10 yaş (pediatrik vaka) |
| En Yaşlı Hasta | 100–109 yaş aralığı |
| Genetik Test Yapılmış Hasta | 43 (%4,4) |

### 1.2 Cinsiyet Dağılımı

| Cinsiyet | Hasta Sayısı | Oran |
|---|---|---|
| Erkek | 640 | %65,4 |
| Kadın | 359 | %36,7 |
| Diğer/Belirtilmemiş | 1 | %0,1 |

**Bulgu:** Erkek hastalar kadın hastalara oranla yaklaşık 1,78 kat daha fazladır. Bu oran, Türkiye'deki onkoloji başvurularında erkeklerde akciğer, mesane ve kolorektal kanserlerin daha yaygın olmasıyla tutarlıdır. Kadın hastalardaki meme kanseri başvurularının varlığı (veri setindeki epikriz notlarından görülebilir) bu dengesizliği kısmen açıklamaktadır; ancak erkek ağırlığı yüksek kalmaya devam etmektedir.

### 1.3 Yaş Dağılımı

| Yaş Grubu | Hasta Sayısı | Oran |
|---|---|---|
| 0–9 | 1 | %0,1 |
| 20–29 | 5 | %0,5 |
| 30–39 | 28 | %2,8 |
| 40–49 | 88 | %9,0 |
| 50–59 | 156 | %15,9 |
| 60–69 | 281 | %28,7 |
| 70–79 | 300 | %30,6 |
| 80–89 | 115 | %11,7 |
| 90–99 | 25 | %2,6 |
| 100+ | 1 | %0,1 |

**Bulgu:** Hastaların **%59,3'ü 60–79 yaş aralığında** yoğunlaşmaktadır. Bu, kanser insidansının yaşla birlikte artmasıyla örtüşen epidemiyolojik bir örüntüdür. 80 yaş üstü hastaların toplam içindeki payı %14,4'tür — bu grup, tedavi toleransı ve yan etki yönetimi açısından özel klinik dikkat gerektirmektedir. 30–49 yaş grubundaki görece genç kanser hastaları (%11,8) ise çalışma çağındaki bireyleri etkilemesi bakımından ayrıca değerlendirilmesi gereken bir alt gruptur.

---

## 2. Departman ve Başvuru Analizi

### 2.1 Departman Dağılımı

| Departman | Kayıt Sayısı | Oran |
|---|---|---|
| Medikal Onkoloji | 18.230 | %96,8 |
| Radyasyon Onkolojisi | 598 | %3,2 |

**Bulgu:** Medikal onkoloji birimi, tüm departman ziyaretlerinin ezici çoğunluğunu oluşturmaktadır. Radyasyon onkolojisine yönlendirme oranının %3,2 ile sınırlı kalması, kombine tedavi (kemo-radyoterapi) protokollerinin bu hasta kohortu içinde görece az uygulandığına ya da hastaların radyasyon tedavisinin büyük bölümünü dış kurumda aldığına işaret edebilir.

### 2.2 Başvuru Trendi (Zaman İçinde)

Veri seti 2007'den 2026'ya kadar uzanan başvuruları kapsamaktadır. Öne çıkan trendler:

- **2008–2018:** Aylık başvuru hacmi 1–16 arasında seyretmiştir; stabil bir hasta tabanına işaret etmektedir.
- **2023 başı:** Belirgin bir zirve gözlemlenmektedir (aylık maksimum ~32 başvuru). Bu, kurumsal kapasite genişlemesi, yeni bir hasta kohortunun dahil edilmesi veya belirli bir kampanya dönemine denk gelmesi ile açıklanabilir.
- **2023 sonrası:** Hacim tekrar orta düzeylere gerilemiştir.

---

## 3. Klinik İşlem Analizi

### 3.1 İşlem Tipi Dağılımı

| İşlem Tipi | Sayı | Oran |
|---|---|---|
| Laboratuvar | 152.357 | %56,7 |
| Diğer | 71.326 | %26,6 |
| Yatış | 17.826 | %6,6 |
| Muayene | 14.016 | %5,2 |
| Radyoloji | 9.697 | %3,6 |
| Kontrol Muayenesi | 3.544 | %1,3 |
| Fizik Tedavi | 3.079 | %1,1 |
| Patoloji | 2.085 | %0,8 |
| Yoğun Bakım | 1.927 | %0,7 |
| Konsültasyon | 1.679 | %0,6 |
| Ameliyat | 1.610 | %0,6 |
| Checkup | 835 | %0,3 |
| Müdahale | 724 | %0,3 |

**Bulgu 1 — Laboratuvar Yükü:** İşlemlerin %56,7'si laboratuvar testlerinden oluşmaktadır. Bu, onkolojik izlem protokollerinde rutin kan sayımı, tümör markerleri ve biyokimyasal testlerin ne denli yoğun kullanıldığını göstermektedir. Hasta başına ortalama laboratuvar işlemi sayısı yüksektir; bu durum, yoğun kemoterapi izlem protokollerini yansıtmaktadır.

**Bulgu 2 — Yatış Oranı:** Yatış işlemleri %6,6 ile üçüncü sırada yer almaktadır. Kemoterapi uygulamaları, yan etki yönetimi ve komplikasyon tedavisinin yatış gerektirdiği düşünüldüğünde bu oran beklentilerle uyumludur.

**Bulgu 3 — Yoğun Bakım:** 1.927 yoğun bakım işlemi, ciddi komplikasyonların görüldüğü bir hasta popülasyonuna işaret etmektedir. Bu sayı, paliyatif bakım planlaması açısından göz önünde bulundurulmalıdır.

---

## 4. İlaç Kullanım Örüntüleri

### 4.1 En Sık Reçete Edilen İlaçlar (İlk 10)

| İlaç | Sipariş Sayısı | Kategori |
|---|---|---|
| %0,9 İzotonik NaCl 100 mL | 4.502 | Destek Tedavisi |
| Dekort (Deksametazon) 8 mg | 4.441 | Kortikosteroid / Antiemetik |
| Progas/Pantpas (Pantoprazol) 40 mg IV | 4.218 / 1.675 | Proton Pompa İnhibitörü |
| İzotonik NaCl 100 mL (Medifleks) | 4.169 | Destek Tedavisi |
| Avil (Feniramin) 45,5 mg | 2.984 | Antihistaminik / Premedikasyon |
| Lasix (Furosemid) 20 mg | 2.227 | Diüretik |
| Prednol-L (Metilprednizolon) 40 mg | 1.794 | Kortikosteroid |
| Metpamid (Metoklopramid) 10 mg | 1.703 | Antiemetik |
| Parol (Parasetamol) 10 mg/mL | 1.642 | Analjezik |
| Combivent (İpratropyum + Salbutamol) | 1.561 | Bronkodilatatör |

**Bulgu 1 — Destek Tedavisi Ağırlığı:** En sık kullanılan ilaçlar; sıvı replasmanı, steroid, antiemetik ve proton pompa inhibitörü kategorilerindedir. Bu, aktif kemoterapi uygulanan hastalarda standart destek tedavi protokollerini yansıtmaktadır.

**Bulgu 2 — Deksametazon Yoğunluğu:** Kortikosteroidlerin (Dekort + Prednol-L = ~6.235 sipariş) bu denli yüksek kullanımı; antiemetik premedikasyon, ödem yönetimi ve immün modülasyon amacıyla geniş bir kullanım alanına sahip olduklarına işaret etmektedir.

**Bulgu 3 — Antibiyotik Kullanımı:** Meropenem (1.228 sipariş) ve Clexane (enoksaparin, 1.366 sipariş) listenin üst sıralarında yer almaktadır. Geniş spektrumlu antibiyotik kullanımı febril nötropeni episodlarına, antikoagülan kullanımı ise tromboembolik riski yüksek onkoloji hastalarına karşılık gelmektedir.

**Bulgu 4 — Tramadol (Contramal):** 1.340 sipariş ile ağrı yönetiminin aktif biçimde yürütüldüğünü ortaya koymaktadır. Paliyatif ağrı yönetiminin yeterince ele alındığına dair bir göstergedir.

---

## 5. Genetik Test Analizi

### 5.1 Yapılan Genetik Testler

| Test | Sayı |
|---|---|
| HLA-DR Low Resolution (Moleküler) | 10 |
| HCV-RNA, Kantitatif | 10 |
| Mikrosatellit İnstabilitesi (MSI) | 8 |
| HLA-DQ Low Resolution | 7 |
| HLA-A Low Resolution | 5 |
| CMV DNA PCR (Kan) | 3 |
| Human Papilloma Virüs (HPV) Genotiplendirme | 2 |
| HIV 1 RNA (Viral Yük) | 2 |
| Hepatit C (HCV) Genotiplendirme | 1 |
| JAK2 V617F | 1 |
| Trombofili Paneli (F2-F5-FXIII, MTHFR, PAI) | 1 |

**Bulgu 1 — Düşük Genetik Test Kullanımı:** Toplam 979 hastanın yalnızca 43'ünde (%4,4) genetik test kaydı mevcuttur. Bu oran, modern onkoloji pratiğinde moleküler tanının önemi düşünüldüğünde oldukça düşük kalmaktadır. Bu durum; veri setinin belirli bir döneme ait olması, genetik test bilgilerinin ayrı bir sistemde tutulması veya kısıtlı test altyapısıyla açıklanabilir.

**Bulgu 2 — MSI Testleri:** Mikrosatellit İnstabilitesi (MSI) testi, 8 hastada yapılmıştır. MSI-H tümörler immünoterapiye yanıt verebildiğinden bu test, immünoterapi kararı için kritik öneme sahiptir. Daha geniş bir hasta kitlesine yönelik MSI taramasının değerlendirilmesi önerilebilir.

**Bulgu 3 — HLA Testleri:** HLA tiplemesi (HLA-DR, HLA-DQ, HLA-A) en sık yapılan genetik testlerdir. Bu durum, kök hücre nakli veya immün ilişkili değerlendirmeler açısından önemlidir.

**Bulgu 4 — Viral Yük Testleri:** HCV-RNA ve hepatit ilişkili testlerin varlığı, kemoterapi öncesi reaktivasyon taraması protokollerinin uygulandığına işaret etmektedir.

---

## 6. Öneriler

### 6.1 Klinik Öncelikler

1. **Genetik/Moleküler Test Kapsamını Genişletme:** MSI, BRCA, KRAS, EGFR ve PD-L1 gibi prediktif biyobelirteçlerin daha sistematik biçimde test edilmesi, hedefe yönelik tedavi ve immünoterapi seçim kararlarını iyileştirebilir.

2. **Yaşlı Hasta Yönetimi:** 70–79 yaş grubunun en kalabalık hasta dilimi olması (%30,6), kapsamlı geriatrik onkoloji protokollerini (performans durumu değerlendirmesi, polifarmasi yönetimi, yatış planlaması) zorunlu kılmaktadır.

3. **Antibiyotik Yönetimi:** Meropenem gibi karbapenem sınıfı antibiyotik kullanımının yüksekliği, febril nötropeni yönetimi protokollerinin ve antibiyotik stewardship programının gözden geçirilmesini gerektirebilir.

### 6.2 Veri Kalitesi İyileştirmeleri

4. **Ölüm Durumu Kaydı:** Veri setinde ölüm durumu alanı büyük oranda boştur. Sağkalım verilerinin sistematik kaydı, hasta sonuçlarının değerlendirilmesi için kritik önemdedir.

5. **Genetik Test Entegrasyonu:** Genetik/genomik test sonuçlarının ana hasta kaydıyla entegre edilmesi, bütüncül hasta profilinin oluşturulmasını sağlayacaktır.

6. **Departman Granülaritesi:** Yalnızca iki departman kaydedilmektedir. Alt uzmanlık alanlarının (örn. meme onkolojisi, akciğer onkolojisi, hematolojik maligniteler) ayrı kaydedilmesi, klinik anlamlı segmentasyona olanak tanır.

### 6.3 Kapasite Planlaması

7. **Laboratuvar Kapasitesi:** Klinik işlemlerin %56,7'sini oluşturan laboratuvar işlemleri, bu birimin stratejik bir darboğaz olduğuna işaret etmektedir. Otomasyon veya numune işleme kapasitesi artırımı kritik öneme sahiptir.

8. **2023 Zirve Analizi:** 2023 başındaki başvuru artışının nedeni araştırılmalıdır. Eğer bu artış kalıcı bir kapasite artışını yansıtıyorsa, insan kaynağı ve altyapı planlamasının buna göre güncellenmesi gerekir.

---

## 7. Metodoloji Notu

Bu analiz, 1.000 kayıtlık bir örneklem üzerinden yürütülmüştür. Veri setinin ham biçimde birden fazla satıra yayılmış hasta kayıtları içerdiği (bir hastanın birden fazla satırda temsil edilebildiği) göz önünde bulundurulduğunda, bazı sayımlar tekil hasta yerine başvuru/kayıt bazında yorumlanmalıdır. Sağkalım analizleri ve hastalık spesifik incelemeler için ölüm tarihi ve epikriz alanlarının daha kapsamlı biçimde temizlenmesi gerekmektedir.

---

*Rapor, Onkoloji Veri Panosu sisteminden otomatik olarak oluşturulmuştur.*
