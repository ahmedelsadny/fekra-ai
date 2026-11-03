#!/bin/bash
# ============================================================
# FEKRA AI — SSL Certificate Setup Script for Ubuntu 22.04
# Run this once on your VPS server to configure HTTPS
# ============================================================
set -e

mkdir -p /root/fekra-ai/ssl
cd /root/fekra-ai

echo "============================================================"
echo "🔒 FEKRA AI — إعداد شهادة الأمان HTTPS"
echo "============================================================"

# If user provided a domain as argument: bash setup-ssl.sh yourdomain.com
DOMAIN=$1

if [ -n "$DOMAIN" ]; then
    echo "🌐 جاري إصدار شهادة Let's Encrypt رسمية للدومين: $DOMAIN ..."
    apt update && apt install -y certbot
    systemctl stop nginx 2>/dev/null || true
    docker stop fekra-nginx 2>/dev/null || true
    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/fullchain.pem
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/privkey.pem
    echo "✅ تم تثبيت شهادة Let's Encrypt الرسمية بنجاح!"
else
    echo "🛡️ جاري إنشاء شهادة SSL ذاتية التوقيع (Self-Signed) للسيرفر..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout ssl/privkey.pem \
      -out ssl/fullchain.pem \
      -subj "/C=EG/ST=Cairo/L=Cairo/O=FEKRA/OU=IT/CN=95.179.160.169"
    echo "✅ تم إنشاء شهادة الأمان بنجاح في ssl/fullchain.pem و ssl/privkey.pem!"
fi

chmod 600 ssl/privkey.pem
chmod 644 ssl/fullchain.pem

echo ""
echo "🚀 جاري إعادة تشغيل Nginx لتفعيل HTTPS..."
docker compose -f docker-compose.prod.yml restart nginx || docker compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "============================================================"
echo "🎉 تم بنجاح! الموقع متاح الآن على HTTPS:"
if [ -n "$DOMAIN" ]; then
    echo "   🔗 https://$DOMAIN"
else
    echo "   🔗 https://95.179.160.169"
fi
echo "============================================================"
