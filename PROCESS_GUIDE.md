# 📚 Complete Process Guide - Section Allotment, Faculty Assignment & Timetable

यह guide आपको step-by-step process बताता है कि students को sections में कैसे allot करें, faculty assign करें, और timetable कैसे schedule करें।

---

## 📋 Complete Workflow (संपूर्ण प्रक्रिया)

### **Step 1: Course और Subjects Setup** (Admin द्वारा)

#### 1.1 Course Create करें
1. **Admin Login** करें
2. **Admin Dashboard** → **Courses** जाएं
3. **Add New Course** form में:
   - Course Name (जैसे: B.Tech Computer Science)
   - Course Code (जैसे: BTECH-CS)
   - Description
   - Duration (Years) - Default 3
4. **Add Course** button click करें

#### 1.2 Subjects Create करें (Important: यह feature अभी code में नहीं है)
⚠️ **Note**: Subjects create करने की functionality अभी missing है। इसे add करना होगा।

**Temporary Solution**: आपको manually MongoDB में subjects add करने होंगे या code में subject creation feature add करना होगा।

**Subject Format**:
```javascript
{
  name: "Data Structures",
  code: "CS201",
  course: <Course_ID>,
  year: 1,
  credits: 3
}
```

---

### **Step 2: HOD और Coordinator Setup** (Admin द्वारा)

#### 2.1 HOD Create करें
1. **Admin Dashboard** → **Faculty** जाएं
2. **Add Faculty** form में:
   - Name: HOD का नाम
   - Email: HOD का email
   - Position: **HOD** select करें
   - Assigned Courses: जिस course का HOD बनाना है, वो select करें
3. **Add Faculty** button click करें

#### 2.2 Coordinator Create करें
1. **Admin Dashboard** → **Faculty** जाएं
2. **Add Faculty** form में:
   - Name: Coordinator का नाम
   - Email: Coordinator का email
   - Position: **Coordinator** select करें
   - Assigned Courses: जिस course का Coordinator बनाना है, वो select करें
3. **Add Faculty** button click करें

#### 2.3 Course में HOD और Coordinator Assign करें
1. **Admin Dashboard** → **Courses** जाएं
2. जिस Course में HOD/Coordinator assign करना है:
   - उस Course के लिए HOD faculty member को select करें (Faculty position update करें)
   - उस Course के लिए Coordinator faculty member को select करें

**Note**: Admin panel में **Faculty Position Update** feature use करें।

---

### **Step 3: Student Admission और Approval** (Admin द्वारा)

#### 3.1 Student Admission Approve करें
1. **Admin Dashboard** → **Admissions** जाएं
2. **Pending Admissions** में students की list दिखेगी
3. जिस student को approve करना है, **Approve** button click करें
4. Student को automatically:
   - Student ID मिलेगा
   - Default password: `1122` set होगा
   - Email sent होगा (development mode में आपकी email पर)

---

### **Step 4: Section Creation और Student Assignment** (HOD द्वारा)

#### 4.1 HOD Login करें
1. **Login Page** पर HOD credentials use करें:
   - Email: HOD का email
   - Password: `1122` (default)
   - Role: **HOD** select करें

#### 4.2 Section Create करें
1. **HOD Dashboard** → **Sections** जाएं
2. **Add Section** form में:
   - Section Name: (जैसे: A, B, C या 1, 2, 3)
   - Year: Section का year (1, 2, 3, या 4)
   - Class Advisor: (Optional) Class Advisor select करें
3. **Add Section** button click करें

**Example**:
- Section A, Year 1
- Section B, Year 1
- Section A, Year 2

#### 4.3 Students को Section में Assign करें
1. **HOD Dashboard** → **Sections** जाएं
2. जिस Section में students assign करना है:
   - उस Section की row में **Assign Student** option होगा
   - Student select करें (list में approved students दिखेंगे)
   - **Assign** button click करें

**Note**: Students जिनकी admission approve हो गई है और उनका Course HOD के course से match करता है, वो assign हो सकते हैं।

---

### **Step 5: Class Advisor Assignment** (HOD द्वारा - Optional)

#### 5.1 Class Advisor को Section Assign करें
1. **HOD Dashboard** → **Sections** जाएं
2. Section create करते समय या बाद में:
   - Section edit करें
   - **Class Advisor** select करें
   - Class Advisor वो faculty member होना चाहिए जिसकी position "class-advisor" है

---

### **Step 6: Faculty Assignment और Timetable Scheduling** (Coordinator द्वारा)

#### 6.1 Coordinator Login करें
1. **Login Page** पर Coordinator credentials use करें:
   - Email: Coordinator का email
   - Password: `1122` (default)
   - Role: **Coordinator** select करें

#### 6.2 Timetable Create करें (Faculty Assignment automatically होगा)
1. **Coordinator Dashboard** → **Timetable** जाएं
2. **Add Timetable Entry** form में:
   - **Section**: जिस Section के लिए timetable बना रहे हैं
   - **Subject**: जो Subject पढ़ाया जाएगा (subject create होना चाहिए)
   - **Faculty**: जो Faculty member इस subject को पढ़ाएगा
   - **Day**: Week का दिन (Monday, Tuesday, etc.)
   - **Start Time**: Class start time (format: HH:MM, जैसे: 09:00)
   - **End Time**: Class end time (format: HH:MM, जैसे: 10:00)
   - **Room**: (Optional) Classroom number
3. **Add Timetable** button click करें

**Important Points**:
- ✅ Faculty को automatically subject assign हो जाता है जब आप timetable create करते हैं
- ✅ System check करता है कि Faculty की same time पर कोई दूसरी class न हो
- ✅ Faculty की maximum 5 lectures per day limit होती है
- ✅ एक Section के लिए multiple entries create कर सकते हैं (अलग-अलग subjects, days, times)

**Example Timetable Entry**:
```
Section: A (Year 1)
Subject: Data Structures
Faculty: Prof. John Doe
Day: Monday
Start Time: 09:00
End Time: 10:00
Room: Lab-101
```

---

### **Step 7: Timetable View** (Students, Faculty, और अन्य users द्वारा)

#### Students के लिए:
- Student अपने dashboard पर अपना **Today's Timetable** देख सकते हैं
- Section के according timetable दिखेगा

#### Faculty के लिए:
- Faculty अपने dashboard पर अपनी classes की list देख सकते हैं

#### Coordinator के लिए:
- Coordinator अपने course की सभी sections का complete timetable देख सकते हैं

---

## 🔄 Complete Flow Summary (संक्षिप्त प्रक्रिया)

```
1. Admin:
   ├─ Course Create करें
   ├─ Subjects Create करें (अभी code में नहीं है - add करना होगा)
   ├─ Faculty Create करें (HOD, Coordinator, Class Advisor, Normal Faculty)
   └─ Students को Approve करें

2. Admin (Course Management):
   ├─ Course में HOD Assign करें
   └─ Course में Coordinator Assign करें

3. HOD:
   ├─ Sections Create करें (Year-wise)
   ├─ Students को Sections में Assign करें
   └─ Class Advisor को Sections Assign करें (Optional)

4. Coordinator:
   ├─ Timetable Entries Create करें
   ├─ Faculty को Subjects Assign करें (Timetable create करते समय automatically)
   └─ Class Schedule Set करें (Day, Time, Room)
```

---

## ⚠️ Important Notes (महत्वपूर्ण नोट्स)

1. **Subjects Creation**: 
   - अभी code में subjects create करने की functionality missing है
   - आपको manually MongoDB में add करना होगा या feature add करनी होगी

2. **Faculty Assignment**:
   - Faculty assignment automatically होता है जब आप timetable create करते हैं
   - एक Faculty एक time पर सिर्फ एक class ले सकता है
   - Faculty की maximum 5 lectures per day limit है

3. **Student Assignment**:
   - Students को section में assign करने से पहले उनकी admission approve होनी चाहिए
   - Student का course HOD के course से match करना चाहिए

4. **Role-based Access**:
   - HOD: अपने course के लिए sections manage कर सकता है
   - Coordinator: अपने course के लिए timetable manage कर सकता है
   - Class Advisor: अपनी section के लिए timetable manage कर सकता है

---

## 🛠️ Missing Features (जो अभी add करने होंगे)

1. **Subject Management**:
   - Admin या HOD को subjects create/edit/delete करने की facility होनी चाहिए
   - Subject के लिए UI और routes add करने होंगे

2. **Bulk Student Assignment**:
   - Multiple students को एक साथ section में assign करने की facility

3. **Timetable View/Edit**:
   - Timetable को visual format में देखने की facility
   - Timetable entries को edit/delete करने की facility

---

## 📝 Quick Reference (शीघ्र संदर्भ)

| Task | Who Can Do | Route |
|------|-----------|-------|
| Create Course | Admin | `/admin/courses` |
| Create Subjects | ❌ Missing | - |
| Create Faculty | Admin | `/admin/faculty` |
| Approve Students | Admin | `/admin/admissions` |
| Create Sections | HOD | `/hod/sections` |
| Assign Students | HOD | `/hod/sections/:id/assign-student` |
| Create Timetable | Coordinator/Class Advisor | `/coordinator/timetable` |
| View Timetable | All | Dashboard |

---

## 🎯 Next Steps (अगले कदम)

1. ✅ HOD और Coordinator create करें (Admin)
2. ✅ Students approve करें (Admin)
3. ✅ Sections create करें (HOD)
4. ✅ Students को sections में assign करें (HOD)
5. ⚠️ **Subjects create करें** (अभी missing - manually या code add करें)
6. ✅ Timetable create करें (Coordinator)
7. ✅ Faculty assignment automatically हो जाएगा (Timetable create करते समय)

---

**क्या आप चाहते हैं कि मैं Subject Management feature add कर दूं?**

