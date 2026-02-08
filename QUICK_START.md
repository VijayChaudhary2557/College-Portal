# 🚀 Quick Start Guide

## Problem: Login Failed / MongoDB Connection Error

अगर आपको **"Login failed"** या **MongoDB connection error** आ रहा है, तो यह steps follow करें:

---

## ⚡ Step 1: MongoDB Start करें

### Option A: Windows Service (Recommended)

1. **PowerShell को Administrator के रूप में खोलें:**
   - Windows key दबाएं
   - "PowerShell" search करें
   - Right-click करें → **"Run as Administrator"**

2. MongoDB service start करें:
   ```powershell
   net start MongoDB
   ```

### Option B: Manually Start

1. **Command Prompt या PowerShell खोलें**

2. MongoDB start करें:
   ```cmd
   mongod --dbpath "C:\data\db" --port 27017
   ```

   **Note:** अगर `C:\data\db` folder नहीं है, तो पहले बनाएं:
   ```cmd
   mkdir C:\data\db
   ```

---

## ⚡ Step 2: Admin User Create करें

**नई PowerShell window** खोलें (जिसमें MongoDB चल रहा हो, उसे close न करें):

```bash
npm run create-admin
```

Success message आएगा:
```
✅ Admin user created successfully!
Email: admin@college.com
Password: admin123
```

---

## ⚡ Step 3: Server Start करें

```bash
npm start
```

Success message देखें:
```
✅ MongoDB Connected Successfully
Server running on port 3000
```

---

## ⚡ Step 4: Login करें

1. Browser में जाएं: `http://localhost:3000`
2. **Login** button पर click करें
3. Form भरें:
   - **Role:** Admin
   - **Email:** `admin@college.com`
   - **Password:** `admin123`
4. Login button click करें

---

## ✅ Success!

अब आपको Admin Dashboard दिखना चाहिए!

---

## ❌ अगर फिर भी Problem आ रही है:

### Check MongoDB Status:
```powershell
Get-Process mongod -ErrorAction SilentlyContinue
```

अगर कुछ दिखे, तो MongoDB चल रहा है ✅

### Check MongoDB Port:
```powershell
netstat -an | findstr 27017
```

अगर `LISTENING` दिखे, तो port सही है ✅

### MongoDB Reinstall करें (अगर जरूरत हो):
1. MongoDB official website से download करें
2. Install करें
3. Service start करें

---

## 🔧 Troubleshooting

**Error:** `connect ECONNREFUSED ::1:27017`
- **Solution:** MongoDB start नहीं है → Step 1 follow करें

**Error:** `Operation users.findOne() buffering timed out`
- **Solution:** MongoDB connection नहीं हो रहा → MongoDB restart करें

**Error:** `Invalid email, password, or role`
- **Solution:** Admin user create नहीं हुआ → Step 2 follow करें

---

**Need Help?** Check `INSTRUCTIONS.md` file for detailed steps!

