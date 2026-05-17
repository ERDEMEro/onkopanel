# OnkoPanel — AWS Deployment Rehberi

Bu rehber projeyi tek bir EC2 sunucusunda Docker Compose ile çalıştırır.  
Mimari: **EC2 (t3.small+)** → Docker Compose → {API + Web + PostgreSQL}

---

## Gereksinimler

- AWS hesabı (eu-central-1 — Frankfurt önerilir)
- Alan adı (ör. `onkopanel.com`) — Route 53 veya başka bir sağlayıcıda
- Yerel makinede: `aws-cli`, `docker`, `git`

---

## Adım 1 — AWS CLI Kurulumu ve Yapılandırması

```bash
# Kur (macOS)
brew install awscli

# Ya da Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Kimlik bilgilerini gir (AWS Console → IAM → Access keys)
aws configure
# AWS Access Key ID: [senin key'in]
# Default region: eu-central-1
# Default output format: json
```

---

## Adım 2 — EC2 Sunucusu Oluştur

### 2a. Security Group

```bash
# Security group oluştur
aws ec2 create-security-group \
  --group-name onkopanel-sg \
  --description "OnkoPanel production" \
  --region eu-central-1

# Dönen GroupId'yi not al, aşağıda kullanacaksın
SG_ID=sg-xxxxxxxxxxxxxxxxx

# HTTP, HTTPS ve SSH'e izin ver
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22   --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80   --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443  --cidr 0.0.0.0/0
```

### 2b. EC2 Instance Başlat

AWS Console → EC2 → Launch Instance:

| Ayar | Değer |
|------|-------|
| AMI | Ubuntu 24.04 LTS (64-bit x86) |
| Instance type | t3.small (2 vCPU, 2 GB RAM) — minimum |
| Key pair | Yeni bir `.pem` oluştur, güvenli yere kaydet |
| Security group | `onkopanel-sg` (yukarıda oluşturduğun) |
| Storage | 20 GB gp3 |

Instance'ı başlat, Public IP'yi not al.

---

## Adım 3 — Sunucuya Docker Kur

```bash
# Sunucuya bağlan
chmod 400 ~/onkopanel-key.pem
ssh -i ~/onkopanel-key.pem ubuntu@<EC2_PUBLIC_IP>

# Docker kur
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Docker Compose kur (v2)
sudo apt-get install -y docker-compose-plugin

# Doğrula
docker --version
docker compose version
```

---

## Adım 4 — Proje Kodunu Sunucuya Aktar

### Seçenek A — Git ile (Tavsiye)

```bash
# GitHub'a push et (henüz yapmadıysan)
# Yerel makinede:
git remote add origin https://github.com/KULLANICI_ADIN/onkopanel.git
git push -u origin main

# EC2 üzerinde:
git clone https://github.com/KULLANICI_ADIN/onkopanel.git
cd onkopanel
```

### Seçenek B — SCP ile Manuel Transfer

```bash
# Yerel makineden:
scp -i ~/onkopanel-key.pem -r . ubuntu@<EC2_PUBLIC_IP>:~/onkopanel
```

---

## Adım 5 — Ortam Değişkenlerini Ayarla

```bash
# EC2 üzerinde, proje dizininde:
cd ~/onkopanel
cp .env.production.example .env

# .env dosyasını düzenle
nano .env
```

Doldurman gereken değerler:

```env
POSTGRES_PASSWORD=en_az_16_karakter_güçlü_şifre
SESSION_SECRET=en_az_32_karakter_rastgele_string
GROQ_API_KEY=gsk_...
SERPER_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> `SESSION_SECRET` için: `openssl rand -hex 32` komutuyla rastgele üretebilirsin.

---

## Adım 6 — SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt-get install -y certbot

# Sertifika al (domain önce A kaydıyla bu IP'ye bakıyor olmalı)
sudo certbot certonly --standalone -d onkopanel.com -d www.onkopanel.com

# Sertifika dosyalarını deploy/ssl/ klasörüne kopyala
mkdir -p ~/onkopanel/deploy/ssl
sudo cp /etc/letsencrypt/live/onkopanel.com/fullchain.pem ~/onkopanel/deploy/ssl/
sudo cp /etc/letsencrypt/live/onkopanel.com/privkey.pem   ~/onkopanel/deploy/ssl/
sudo chown ubuntu:ubuntu ~/onkopanel/deploy/ssl/*.pem
```

Ardından `artifacts/onkoloji-dashboard/nginx.conf` dosyasına HTTPS bloğunu ekle:

```nginx
server {
    listen 443 ssl http2;
    server_name onkopanel.com www.onkopanel.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # ... geri kalan lokasyon bloklarını buraya kopyala
}

server {
    listen 80;
    server_name onkopanel.com www.onkopanel.com;
    return 301 https://$host$request_uri;
}
```

---

## Adım 7 — Uygulamayı Başlat

```bash
cd ~/onkopanel

# Docker image'larını build et (ilk seferde ~5-10 dk sürer)
docker compose build

# Veritabanı şemasını oluştur
docker compose up -d postgres
sleep 5
docker compose run --rm db-migrate

# Tüm servisleri başlat
docker compose up -d

# Logları kontrol et
docker compose logs -f api
docker compose logs -f web
```

---

## Adım 8 — Domain'i Bağla (Route 53 veya Başka Sağlayıcı)

### Route 53 Kullanıyorsan:

```bash
# Hosted zone oluştur (zaten yoksa)
aws route53 create-hosted-zone \
  --name onkopanel.com \
  --caller-reference $(date +%s) \
  --region eu-central-1

# A kaydı ekle
# AWS Console → Route 53 → Hosted zones → onkopanel.com
# Create record:
#   Record name: @ (veya boş)
#   Record type: A
#   Value: <EC2_PUBLIC_IP>
#   TTL: 300
```

### Başka Sağlayıcı (GoDaddy, Namecheap vb.):

DNS yönetim panelinde:
```
Type: A
Host: @
Value: <EC2_PUBLIC_IP>
TTL: 300
```
```
Type: A
Host: www
Value: <EC2_PUBLIC_IP>
TTL: 300
```

DNS yayılması 5-30 dakika sürer.

---

## Adım 9 — Sertifika Otomatik Yenileme

```bash
# Crontab'a ekle (her gün gece 3'te kontrol)
sudo crontab -e
# Şu satırı ekle:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/onkopanel.com/*.pem ~/onkopanel/deploy/ssl/ && docker compose -f ~/onkopanel/docker-compose.yml restart web
```

---

## Güncelleme (Kod Değişikliği Sonrası)

```bash
cd ~/onkopanel

# Yeni kodu çek
git pull origin main

# Rebuild ve yeniden başlat
docker compose build
docker compose up -d --no-deps api web

# Sağlık kontrolü
curl http://localhost/api/healthz
```

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `docker compose build` çok uzun sürüyor | Normal — ilk build için 5-10 dk beklenmeli |
| API başlamıyor | `docker compose logs api` — DATABASE_URL doğru mu? |
| Site açılmıyor | Security Group'ta port 80/443 açık mı? |
| Veritabanı bağlantı hatası | `docker compose ps postgres` — healthy mi? |
| SSL sertifikası hatası | Domain A kaydı EC2 IP'sine bakıyor mu? |

---

## Maliyet Tahmini (eu-central-1)

| Kaynak | Aylık Maliyet |
|--------|--------------|
| EC2 t3.small | ~15 $ |
| 20 GB EBS gp3 | ~1.6 $ |
| Veri transferi (10 GB) | ~0.9 $ |
| Route 53 Hosted Zone | 0.5 $ |
| **Toplam** | **~18 $/ay** |
