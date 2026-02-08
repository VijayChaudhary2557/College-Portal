# MongoDB Setup Instructions

## Problem: MongoDB Connection Error

अगर आपको `connect ECONNREFUSED ::1:27017` error आ रहा है, तो MongoDB server start करना होगा।

## Solutions:

### Option 1: MongoDB Service Start करें (Recommended)

**PowerShell को Administrator के रूप में खोलें** और यह command run करें:

```powershell
net start MongoDB
```

या **Command Prompt को Administrator के रूप में खोलें** और:

```cmd
net start MongoDB
```

### Option 2: MongoDB Manually Start करें

अगर service काम नहीं कर रही, तो MongoDB को manually start करें:

1. **Command Prompt या PowerShell खोलें**
2. यह command run करें:

```cmd
mongod --dbpath "C:\data\db" --port 27017
```

**Note:** पहली बार MongoDB run करने से पहले data directory बनाएं:

```cmd
mkdir C:\data\db
```

### Option 3: MongoDB Atlas (Cloud Database) Use करें

अगर local MongoDB में problem है, तो MongoDB Atlas (free cloud database) use कर सकते हैं:

1. https://www.mongodb.com/cloud/atlas पर जाएं
2. Free account बनाएं
3. Cluster बनाएं
4. Connection string लें
5. `.env` file में `MONGODB_URI` update करें

## After MongoDB Starts:

1. MongoDB start होने के बाद, admin user create करें:

```bash
npm run create-admin
```

2. Server start करें:

```bash
npm start
```

3. Browser में जाएं: `http://localhost:3000`

## Admin Credentials:

- **Email:** `admin@college.com`
- **Password:** `admin123`
- **Role:** Admin

---

**Quick Fix:** PowerShell को **"Run as Administrator"** करके `net start MongoDB` run करें!

