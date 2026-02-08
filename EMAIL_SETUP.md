# 📧 Email Configuration Guide

## Problem: Emails नहीं जा रहे

अगर emails नहीं जा रहे हैं, तो आपको email configuration setup करनी होगी।

---

## ⚡ Quick Setup (Gmail)

### Step 1: Gmail App Password बनाएं

1. **Google Account Settings** में जाएं:
   - https://myaccount.google.com/
   - Security → 2-Step Verification (enable करें अगर नहीं है)

2. **App Passwords** बनाएं:
   - Security → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Name: "College Portal"
   - "Generate" पर click करें
   - **16-character password copy करें** (इसे .env में use करेंगे)

### Step 2: .env File बनाएं

Project root folder में `.env` file बनाएं:

```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/college-portal
PORT=3000
SESSION_SECRET=your-secret-key-change-in-production

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Important:** 
- `EMAIL_USER`: आपका Gmail address
- `EMAIL_PASS`: App Password (16 characters), regular password नहीं!

### Step 3: Server Restart करें

```bash
npm start
```

---

## 🔧 Other Email Providers

### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Custom SMTP

```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

---

## ✅ Test Email

Server start करने के बाद, console में यह message दिखना चाहिए:
```
✅ Email server is ready to send messages
```

अगर error आए:
- `EAUTH`: Wrong credentials - App Password check करें
- `ECONNECTION`: Server connection issue - EMAIL_HOST check करें

---

## 🚨 Common Issues

### Issue 1: "Email not configured"
**Solution:** `.env` file बनाएं और EMAIL_USER, EMAIL_PASS add करें

### Issue 2: "Authentication failed"
**Solution:** 
- Gmail के लिए App Password use करें (regular password नहीं)
- 2-Step Verification enable करें

### Issue 3: "Connection failed"
**Solution:** 
- EMAIL_HOST और EMAIL_PORT सही हैं या नहीं check करें
- Firewall check करें

---

## 📝 Note

अगर email configure नहीं है, तो:
- User create होगा ✅
- Email नहीं जाएगा ❌
- Console में password दिखेगा 📋
- Portal पर success message में password दिखेगा 🔑

**Production में email configuration जरूरी है!**

