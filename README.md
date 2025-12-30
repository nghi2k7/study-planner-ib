# Study Planner - IB CSIA Project

A priority-based scheduling application for IB students to manage homework tasks and exam revision.

## 🚀 Features

- **Authentication**: Login/Register with Email or Google OAuth.
- **Task Management**: Add homework tasks with deadlines and estimated durations.
- **Exam Planning**: Schedule exams and distribute revision time automatically.
- **Smart Scheduling (Greedy Algorithm)**: 
  - Prioritizes homework by nearest deadline.
  - Distributes exam revision across 3+ days.
  - **Greedy Filling**: Automatically splits large tasks to fill available daily slots.
  - **Unscheduled Warnings**: Alerts users if the budget/deadline cannot accommodate all tasks.
- **Rescheduling Logic**: Missed sessions are automatically redistributed across the next 3 days.
- **Weekly Calendar**: Responsive 7-day grid with horizontal scroll on mobile.
- **Daily Task List**: Detailed view of tasks for the selected day with status tracking.
- **Export CSV**: Download your complete study plan (Schedule, Tasks, and Exams).
- **Responsive UI**: Fully optimized for mobile, tablet, and desktop (including a custom 480px breakpoint).

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Tailwind CSS.
- **Backend**: Firebase (Authentication + Firestore).
- **Deployment**: Firebase Hosting.
- **Build Tool**: Vite.
- **Icons**: Lucide React.
- **Notifications**: React Hot Toast.
- **Date Handling**: date-fns.

## 📦 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd study-planner
```

### 2. Install dependencies
```bash
yarn install
# or
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and fill in your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=study-planner-ib
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Setup Firebase
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password & Google).
3. Create a **Firestore Database**.
4. Install Firebase CLI: `npm install -g firebase-tools`.
5. Login: `firebase login`.
6. Deploy Rules & Indexes: `firebase deploy --only firestore`.

### 5. Setup Firestore Rules
The project uses the following rules (stored in `firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /tasks/{taskId} {
      allow read, update, delete: if isOwner();
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    match /exams/{examId} {
      allow read, update, delete: if isOwner();
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    match /sessions/{sessionId} {
      allow read, update, delete: if isOwner();
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    match /scheduleLogs/{logId} {
      allow read, delete: if isOwner();
      allow create: if request.auth != null;
    }
  }
}
```

## 🏃‍♂️ Running Locally
```bash
yarn dev
# or
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📝 Usage Guide

### 1. Sign Up / Login
- Create an account with your email or use **Google Sign-In**.
- Note: If you registered with Google, use Google to login subsequently.

### 2. Add Tasks & Exams
- Click **Add Task** for short-term homework.
- Click **Add Exam** for upcoming tests.
- Set realistic durations (Estimated Time).

### 3. Generate & Manage Schedule
- Adjust your **Daily Budget** in the sidebar settings.
- Click **Generate Schedule**. Large tasks will be automatically split to fit your budget.
- Click any session to mark it as **Complete** or **Missed**.
- **Missed** sessions are automatically rescheduled across the next 3 days.

### 4. Export Data
- Click **Export CSV** in the header to download your complete study plan for Excel/Printing.

## Deployment
To deploy to Firebase Hosting:
```bash
# 1. Build the production bundle
yarn build

# 2. Deploy to Firebase
firebase deploy --only hosting
```

### ⚠️ Important: Fixing Permission Errors on Production
If you encounter "Missing or insufficient permissions" on the live site:
1. Go to **Firebase Console** -> **Firestore Database**.
2. **Delete** the `sessions` collection (to clear legacy data without userId).
3. Open your live site, **Logout**, and **Login** again.
4. Click **Generate Schedule** to create fresh, valid data.

## 📊 Project Structure
```bash
src/
├── components/
│   ├── auth/              # Login, Register, Protected Routes
│   ├── dashboard/         # Dashboard, Calendar, Daily List
│   ├── tasks/             # Task forms and lists
│   ├── exams/             # Exam forms and lists
│   ├── schedule/          # Schedule Generator, Session Cards
│   └── common/            # Navbar, Loading, Error Boundary
├── services/
│   ├── firebase.js        # Firebase config & initialization
│   ├── authService.js     # Auth operations
│   ├── taskService.js     # Task CRUD
│   ├── examService.js     # Exam CRUD
│   └── scheduleService.js # Session & Schedule persistence
├── utils/
│   ├── schedulingAlgorithm.js  # Core Greedy Logic
│   ├── exportCSV.js            # CSV Export utility
│   └── dateHelpers.js          # Date formatting
├── contexts/
│   └── AuthContext.jsx    # Authentication state
└── App.jsx                # Main entry & Routing
```

## Success Criteria (CSIA)
1. ✅ **Performance**: 7-day schedule generated in < 5 seconds.
2. ✅ **Deadlines**: All homework scheduled before deadlines.
3. ✅ **Distribution**: 80% of revision distributed over 3+ days.
4. ✅ **Rescheduling**: Missed sessions re-allocated within 3 days.
5. ✅ **Compatibility**: Works on Chrome and Edge.
6. ✅ **Persistence**: Data syncs across devices via Firebase.

## 📄 License
Educational use for IB Computer Science HL Internal Assessment.

## 👨‍💻 Author
Lam Xuan Nghi - IB Diploma Student
