# Smart Gym System
The Smart Gym System is a premium, full-stack fitness application designed to manage modern gym operations. It features role-based access for Admins, Trainers, and Members, with a futuristic "Glassmorphism" UI and robust backend functionality.

## Features

### 🌟 Role-Based Dashboards
*   **Member**: View workout plans, book sessions, track progress, and manage profile.
*   **Trainer**: Create/edit workout plans, manage schedule (accept/reject bookings), and view client stats.
*   **Admin**: Manage users, equipment inventory, and generate system reports.

### 🏋️ Core Functionality
*   **Workout Management**: Dynamic creation and assignment of workout plans.
*   **Booking System**: Conflict-aware scheduling for trainer sessions (In-person/Remote).
*   **Progress Tracking**: Record workouts and visualize history.
*   **Inventory**: Track gym equipment status (Operational/Maintenance).
*   **Reports**: Generate financial and engagement analytics.

### 🎨 UI/UX
*   **Glassmorphism Design**: Modern, translucent interface with blur effects.
*   **Interactive Elements**: Hover effects, micro-animations, and dynamic backgrounds.
*   **Responsive**: Optimized for various screen sizes.

---

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** (Node Package Manager)

### Installation

1.  **Clone the Repository** (if applicable) or navigate to the project folder:
    ```bash
    cd SmartGym/app
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    *   The project uses a local SQLite database.
    *   A `.env` file should be automatically created, but if missing, create one in the root `app` folder with:
        ```env
        DATABASE_URL="file:./dev.db"
        JWT_SECRET="super-secret-key-change-me"
        ```

4.  **Setup Database**:
    *   Push the schema to the database:
        ```bash
        npx prisma db push
        ```

5.  **Seed Initial Data**:
    *   Populate the database with demo users (Admin, Trainer, Member) and sample workouts:
        ```bash
        node scripts/seed.ts
        ```

6.  **Run Development Server**:
    ```bash
    npm run dev
    ```

7.  **Access the App**:
    *   Open your browser and go to [http://localhost:3000](http://localhost:3000).
8.  **Close the App**:
    Press Ctrl-C in the command window and then press Y.
---

## Testing Guide (Demo Accounts)

Use the following credentials to explore the different roles:

### 1. Admin Role
*   **Email**: `admin@smartgym.com`
*   **Password**: `password123`
*   **Actions to Try**:
    *   Go to **Dashboard** to see system overview.
    *   Navigate to **Manage Users** to delete a user.
    *   Check **Equipment** to add/remove machines.
    *   View **Reports** to generate analytics.

### 2. Trainer Role
*   **Email**: `trainer@smartgym.com`
*   **Password**: `password123`
*   **Actions to Try**:
    *   **Create Workout Plan**: Add a new routine with custom exercises.
    *   **Edit Workout**: Modify an existing plan.
    *   **Schedule**: View pending bookings and Accept/reject them.

### 3. Member Role
*   **Email**: `member@smartgym.com`
*   **Password**: `password123`
*   **Actions to Try**:
    *   **Browse Workouts**: Search for "Yoga" or "HIIT".
    *   **Book Trainer**: Schedule a session with "John Trainer".
    *   **Start Workout**: Use the active timer to log a session.
    *   **Profile**: Update your weight/height in the new Edit Profile mode.

---

## Tech Stack
*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
*   **Backend**: Next.js API Routes
*   **Database**: SQLite, Prisma ORM
*   **Authentication**: Custom JWT Auth with bcrypt encryption
