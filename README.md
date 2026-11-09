# 💰 SmartSpend – Personal Finance Tracker

SmartSpend is a full-stack personal finance management web application that helps users track their income, expenses, manage monthly budgets, and monitor their financial activities through an interactive dashboard.

The application provides a simple and user-friendly interface to make personal financial management easier and more organized.

## 🚀 Features

- **User Authentication:** User registration and login with JWT-based authentication.
- **Interactive Dashboard:** View total income, expenses, and available balance.
- **Transaction Management:** Add, edit, and delete income and expense transactions.
- **Transaction History:** View and filter financial transactions.
- **Budget Management:** Set monthly budgets and category-wise spending limits.
- **Spending Analytics:** Visualize financial activities through charts.
- **Recent Transactions:** View the latest financial activities.
- **Form Validation:** Display validation messages and notifications.

## 🛠️ Technologies Used

### Frontend
- React.js
- Tailwind CSS
- JavaScript
- HTML
- CSS

### Backend
- Java
- Spring Boot
- REST APIs
- JWT Authentication

### Database
- MongoDB Atlas

### Development Tools
- Visual Studio Code
- Git and GitHub
- Postman
- Maven
- Node.js and npm

## 📂 Project Structure

```text
finance-tracker/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── pom.xml
│   └── mvnw.cmd
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Java JDK
- Node.js and npm
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/PrathameshSurve1509/SmartSpend---Personal-Finance-Tracker-.git
```

Navigate into the project:

```bash
cd SmartSpend---Personal-Finance-Tracker-
```

### 2. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Configure the required environment variables in your environment or application configuration:

```text
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Use the variable names expected by your backend configuration. Never commit actual credentials or secrets to GitHub.

Run the Spring Boot application:

**Windows:**
```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:5173/
```

Make sure the frontend API configuration points to your running backend.

## 🔐 Security

- JWT-based authentication.
- Protected backend APIs.
- User authentication and authorization.
- Environment variables for sensitive configuration.
- No database passwords or secret keys should be committed to the repository.

## 📸 Screenshots

Add screenshots of your actual application here.

Suggested screenshots:

- Login and Registration Page
- Main Dashboard
- Transaction Management
- Budget Management
- Spending Analytics

## 🎯 Project Objective

The objective of SmartSpend is to develop a personal finance management platform that allows users to monitor their financial activities, track expenses, and manage budgets efficiently.

This project demonstrates the integration of frontend development, backend development, database management, REST API development, and authentication in a full-stack web application.

## 👨‍💻 Developer

**Prathamesh Surve**

- GitHub: [PrathameshSurve1509](https://github.com/PrathameshSurve1509)
- Project Repository: [SmartSpend – Personal Finance Tracker](https://github.com/PrathameshSurve1509/SmartSpend---Personal-Finance-Tracker-)

---

⭐ If you find this project interesting, feel free to explore the repository!
