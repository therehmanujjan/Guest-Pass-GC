# Grand City Guest Pass Management System
## User Training Guide - RBAC Based

### 🌐 **Production URL for Staff:**
**https://gc-guestpass-2bcpakxr1-ali-bin-nadeems-projects.vercel.app**

---

## 📋 **System Overview**
The Grand City Guest Pass Management System is a comprehensive digital solution for managing visitor access, tracking guest movements, and maintaining security protocols. The system uses Role-Based Access Control (RBAC) to ensure appropriate access levels for different staff members.

---

## 👥 **User Roles & Permissions**

### 🔴 **Executive Level (Managing Directors, CEO, Chairman)**
**Access Level:** Full System Access
- ✅ View all visits across all executives
- ✅ Approve/reject visit requests
- ✅ Generate reports
- ✅ Manage visitor check-ins/check-outs
- ✅ Create both scheduled and walk-in visits
- ✅ Full QR code generation and sharing capabilities

### 🟡 **Director Level (Operations, Regional Directors)**
**Access Level:** Departmental Access
- ✅ View visits for their department/region
- ✅ Approve/reject visits within their jurisdiction
- ✅ Manage visitor check-ins/check-outs for their area
- ✅ Create scheduled and walk-in visits
- ✅ Generate QR codes and share passes

### 🟢 **Administrative Staff**
**Access Level:** Operational Access
- ✅ Create scheduled visits for executives
- ✅ View pending approvals
- ✅ Check visitor status
- ✅ Basic reporting for their assigned executives

---

## 🚀 **Getting Started**

### **1. System Access**
1. Open your web browser (Chrome, Firefox, Safari recommended)
2. Navigate to: **https://gc-guestpass-2bcpakxr1-ali-bin-nadeems-projects.vercel.app**
3. The system will automatically detect your executive profile based on local storage
4. You'll see your personalized dashboard

### **2. Dashboard Overview**
Upon login, you'll see:
- **Today's Statistics**: Scheduled visits, total visits, pending approvals, checked-in visitors
- **Pending Approvals**: Visitors awaiting your approval (if any)
- **Recent Visits**: Quick access to recent visitor records
- **Quick Actions**: Buttons to create new visits or manage existing ones

---

## 📱 **Core Functions**

### **Creating a New Visit**

#### **Option A: Scheduled Visit**
1. Click **"Create New Visit"** button
2. Fill in visitor details:
   - **Visitor Name** (Required)
   - **Company/Organization**
   - **Phone Number** (with automatic +92 formatting)
   - **Email Address**
   - **Purpose of Visit** (Required)
3. Set visit schedule:
   - **Date** (defaults to today)
   - **Time From** and **Time To**
4. Select **Visit Type**: Choose "Scheduled"
5. Click **"Create Visit"**
6. The system will generate a unique visit code (e.g., GC-2025-000001)

#### **Option B: Walk-in Visit**
1. Click **"Create New Visit"** button
2. Fill in visitor details as above
3. Select **Visit Type**: Choose "Walk-in"
4. The visitor will be marked as arrived immediately
5. Click **"Create Visit"**

### **Visitor Approval Process**

#### **For Executives (Approval Required)**
1. When someone creates a visit for you, it appears in **"Pending Approvals"**
2. Review visitor details:
   - Name and company
   - Purpose of visit
   - Scheduled time
   - Visit type (walk-in/scheduled)
3. **Action Options**:
   - ✅ **Approve**: Click green checkmark
   - ❌ **Reject**: Click red X button
   - 📋 **View Details**: Click on visitor card

#### **Auto-approval for Own Visits**
- When you create visits for yourself, they're automatically approved
- You can still modify or cancel them later

### **Managing Active Visits**

#### **Check-in Process**
1. Visitor arrives at reception
2. Search for their visit using:
   - Visit code (GC-2025-XXXXXX)
   - Visitor name
   - Company name
3. Click **"Check In"** button
4. System records arrival time and updates status

#### **Check-out Process**
1. When visitor leaves, find their record
2. Click **"Check Out"** button
3. System records departure time
4. Visit status changes to "Completed"

---

## 📤 **Sharing Visitor Passes**

### **QR Code Generation**
- Every visit gets a unique QR code automatically
- QR codes contain encrypted visit information
- Security staff can scan QR codes for verification

### **Sharing Options**
1. **WhatsApp Share** (Recommended):
   - Click **"Share via WhatsApp"**
   - System opens WhatsApp with pre-filled message
   - Includes visitor details and visit code
   - **Note**: Ensure visitor's phone number is in international format (+92...)

2. **SMS Share**:
   - Click **"SMS"** button
   - Opens default SMS app with formatted message
   - Includes essential visit details

3. **Download Pass**:
   - Click **"Download"** to save digital pass as PNG
   - High-quality image suitable for printing
   - Contains QR code and all visit details

---

## 📊 **Reports & Analytics**

### **Dashboard Statistics**
- **Today's Visits**: Real-time count of scheduled visitors
- **Weekly Overview**: Total visits for the current week
- **Pending Approvals**: Action items requiring attention
- **Currently Checked In**: Active visitors in the building

### **Visit History**
- Access through main navigation
- Filter by:
  - Date range
  - Visit status (scheduled, checked-in, completed, cancelled)
  - Visitor name or company
  - Visit type (scheduled/walk-in)

---

## 🔐 **Security Features**

### **QR Code Security**
- Each QR code is unique and encrypted
- Contains visit verification data
- Cannot be duplicated or forged
- Expires automatically after visit completion

### **Data Protection**
- All visitor data stored locally in browser
- No external data transmission
- Automatic backup to local storage
- Privacy-compliant (data stays on your device)

### **Access Control**
- Role-based permissions ensure data security
- Executives can only see their own visitors
- System logs all check-in/check-out activities

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **QR Code Not Generating**
- **Solution**: Refresh the page and try again
- **Cause**: Browser may have blocked the QR code library
- **Prevention**: Use modern browsers (Chrome, Firefox, Safari)

#### **WhatsApp Share Not Working**
- **Solution**: Check visitor's phone number format
- **Required Format**: +92XXXXXXXXXX (include country code)
- **Alternative**: Use SMS or download options

#### **Download Feature Issues**
- **Solution**: Ensure browser allows downloads
- **Check**: Pop-up blockers may interfere
- **Alternative**: Use screenshot or manual sharing

#### **Camera Not Working (for QR scanning)**
- **Solution**: Grant camera permissions when prompted
- **Check**: Browser settings → Privacy → Camera permissions
- **Alternative**: Manually enter visit codes

#### **Data Not Saving**
- **Solution**: Check browser's local storage settings
- **Cause**: Private/incognito mode may block storage
- **Prevention**: Use normal browsing mode

### **System Requirements**
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Internet**: Required for initial load and WhatsApp sharing
- **Camera**: Optional (for QR code scanning feature)
- **Storage**: Local storage must be enabled

---

## 📞 **Support & Contact**

### **Technical Support**
For system issues or questions:
- **Technology Consultant**: Ali Bin Nadeem
- **Email**: ali.nadeem@grandcity.pk

### **Administrative Support**
For access issues or role changes:
- **Consultant**: Ali Moeen
- **Email**: ali.moeen@grandcity.pk

### **Executive Support**
For policy questions or approvals:
- **CEO**: Khalid Noon
- **Email**: khalid@grandcity.pk

---

## 🎯 **Best Practices**

### **For Daily Operations**
1. **Check dashboard first thing in the morning** for pending approvals
2. **Create scheduled visits at least 24 hours in advance** when possible
3. **Always verify visitor identity** before checking them in
4. **Use QR codes** for faster check-in process
5. **Share passes immediately** after approval

### **For Security**
1. **Never share your executive access** with others
2. **Always check visitor ID** against the pass information
3. **Report suspicious activities** immediately
4. **Keep visitor data confidential**
5. **Ensure visitors are escorted** in restricted areas

### **For Efficiency**
1. **Use templates** for recurring visitor types
2. **Batch approve** multiple visits when appropriate
3. **Set up recurring visits** for regular business partners
4. **Use walk-in feature** only for genuine unscheduled visitors
5. **Download passes** as backup for internet issues

---

## ✅ **Quick Reference Checklist**

### **Before Visitor Arrival**
- [ ] Visit approved in system
- [ ] Pass shared with visitor
- [ ] Security notified if required
- [ ] Meeting room booked if needed

### **During Visitor Check-in**
- [ ] Verify visitor identity
- [ ] Scan QR code or enter visit code
- [ ] Issue visitor badge if required
- [ ] Notify executive of arrival

### **After Visit Completion**
- [ ] Ensure visitor checks out
- [ ] Update visit status
- [ ] File any necessary reports
- [ ] Follow up on action items

---

**🎉 Congratulations! You're now ready to use the Grand City Guest Pass Management System effectively. Remember, this system enhances security while improving visitor experience. Use it wisely and maintain the highest standards of professionalism.**

**Last Updated**: December 2025
**Version**: 1.0
**System**: Grand City Guest Pass Management System