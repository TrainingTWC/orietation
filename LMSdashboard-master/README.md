# 📊 Employee Training Dashboard

A comprehensive training analytics dashboard with role-based access control for employees, managers, trainers, and administrators.

🔗 **Live Dashboard:** https://trainingtwc.github.io/LMSdashboard/

## ✨ Features

### 🎯 Role-Based Access Control
- **Admin View**: Full dashboard with all analytics and filters
- **Employee View**: Personal training progress and course details
- **Manager View**: Hierarchical team view with direct and indirect reports
- **Trainer View**: Store-based access with role hierarchy (Trainer/E-Learning/Training Head/HR Head)

### 📈 Analytics & Insights
- Course completion tracking
- Performance categorization (High Performers, Average, Needs Attention)
- Regional and store-level analytics
- Tenure-based analysis
- Designation and department breakdowns
- Interactive charts and visualizations

### 🎨 User Experience
- Mobile-responsive design
- Dark/Light theme toggle
- Collapsible filters for mobile
- Real-time data updates
- Export functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TrainingTWC/LMSdashboard.git
   cd LMSdashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## 📚 Access Control Guide

### URL Parameters

Access different views using URL parameters:

| View Type | Parameter | Example |
|-----------|-----------|---------|
| Admin | None | `https://trainingtwc.github.io/LMSdashboard/` |
| Employee | `employee_id` | `?employee_id=EMP001` |
| Manager | `manager_id` | `?manager_id=H2595` |
| Trainer | `trainer_id` | `?trainer_id=H1761` |

### Trainer Role Hierarchy

| Role | ID | Access Level |
|------|-----|-------------|
| Trainer | H1761, H701, H1697, etc. | Assigned stores only |
| E-Learning Specialist | H541 | Full access (all stores) |
| Training Head | H3237 | Full access (all stores) |
| HR Head | H2081 | Full access (all stores) |

📖 **Full Documentation:** See [ROLE_ACCESS_GUIDE.md](./ROLE_ACCESS_GUIDE.md)

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Data Processing:** d3-dsv
- **Deployment:** GitHub Pages

## 📁 Project Structure

```
├── components/
│   ├── TrainerView.tsx       # Trainer role-based view
│   ├── ManagerView.tsx       # Hierarchical manager view
│   ├── EmployeeView.tsx      # Individual employee view
│   ├── Dashboard.tsx         # Main analytics dashboard
│   └── [Other components]
├── data/
│   └── storeMapping.ts       # Store and role mapping
├── services/
│   ├── dataPersistenceService.ts
│   └── githubUploadService.ts
├── scripts/
│   └── updateStoreMapping.js # Store data update script
└── types.ts                  # TypeScript type definitions
```

## 🔐 Admin Features

Admin panel includes:
- Data upload and management
- GitHub integration for data persistence
- Configuration management
- User session management

Access admin panel: Click the lock icon when viewing the dashboard

## 📊 Data Format

Upload CSV files with the following structure:

```csv
employee_code,employee_name,designation,department,course_name,course_category,course_completion_status,date_of_joining,Store ID
EMP001,John Doe,Barista,Operations,Food Safety 101,Safety,Completed,2024-01-15,S001
```

For enhanced analytics, include `Store ID` column to enable:
- Regional analysis
- Store performance tracking
- Trainer-specific views
- Area manager insights

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support:
- 📧 Contact the development team
- 🐛 [Open an issue](https://github.com/TrainingTWC/LMSdashboard/issues)
- 📖 Check the [Role Access Guide](./ROLE_ACCESS_GUIDE.md)

## 🎯 Roadmap

- [ ] Advanced filtering options
- [ ] Email notifications
- [ ] Mobile app
- [ ] Real-time LMS integration
- [ ] Authentication with Azure AD
- [ ] Export to PDF/Excel

---

**Version:** 2.0 - Role-Based Access Control  
**Last Updated:** October 24, 2025
