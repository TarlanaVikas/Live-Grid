# Live Grid - Collaborative Spreadsheet App

A modern, real-time collaborative spreadsheet application built with Next.js 16, Firebase, and TypeScript. Experience seamless collaboration with live editing, formula evaluation, and professional UI design.

🎥 **Demo Video**: [Watch here](https://drive.google.com/file/d/1_D3TOAa7_VMjzZcVQE02xXkdASICr_cH/view?usp=sharing)

![Live Grid](https://img.shields.io/badge/Live%20Grid-Collaborative%20Spreadsheet-blue?style=for-the-badge&logo=google-sheets)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange?style=flat&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwindcss)
![Turbopack](https://img.shields.io/badge/Turbopack-Bundler-lightgrey?style=flat&logo=webpack)
![ESLint](https://img.shields.io/badge/ESLint-Linting-purple?style=flat&logo=eslint)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-teal?style=flat&logo=netlify)

## ✨ Features

### 🚀 Core Functionality
- **Real-time Collaboration**: Multiple users can edit the same spreadsheet simultaneously
- **Live Presence**: See who's online and what they're editing
- **Formula Support**: Built-in formula evaluation including SUM, arithmetic operations
- **Cell Formatting**: Bold, italic, text color, and background color options
- **Authentication**: Google OAuth and anonymous login support

### 📊 Data Management
- **Export Options**: CSV, TSV, JSON, and HTML export formats
- **Data Persistence**: All changes automatically saved to Firebase Firestore
- **Version Control**: Git-based project structure
- **Responsive Design**: Works on desktop and mobile devices

### 🎨 User Experience
- **Professional UI**: Modern design with Inter typography and smooth animations
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Intuitive Interface**: Clean, spreadsheet-like experience
- **Micro-interactions**: Subtle animations and visual feedback
- **Keyboard Navigation**: Full keyboard support for power users

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 with Turbopack, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase Firestore (real-time database)
- **Authentication**: Firebase Auth (Google OAuth + Anonymous)
- **Deployment**: Ready for Vercel, Netlify, or any Node.js hosting
- **Development**: ESLint, automated cleanup scripts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Firebase project (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TarlanaVikas/Live-Grid.git
   cd live-grid
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase (Optional but recommended)**
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Firestore and Authentication
   - Copy your Firebase config to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Start creating collaborative spreadsheets!

## 📁 Project Structure

```
live-grid/
├── app/                    # Next.js app directory
│   ├── docs/[id]/         # Individual spreadsheet pages
│   ├── globals.css        # Global styles and animations
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Dashboard/home page
├── components/            # React components
│   ├── AuthGate.tsx       # Authentication wrapper
│   ├── Cell.tsx           # Individual spreadsheet cell
│   ├── Providers.tsx      # Context providers
│   └── SpreadsheetGrid.tsx # Main spreadsheet component
├── context/               # React context
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── documents.ts       # Firebase document operations
│   ├── export.ts          # Data export functionality
│   ├── firebase.ts        # Firebase configuration
│   ├── formula.ts         # Formula evaluation engine
│   └── types.ts           # TypeScript type definitions
├── scripts/               # Development scripts
│   ├── cleanup.js         # Lock file cleanup
│   └── force-cleanup.js   # Aggressive cleanup
├── public/                # Static assets
└── firestore.rules        # Firebase security rules
```

## 🎯 Usage Guide

### Creating a Spreadsheet
1. Click "New Document" on the dashboard
2. Start typing in any cell
3. Use formulas like `=SUM(A1:A5)` or `=A1+B1`

### Formatting Cells
- **Bold**: Click the B button in the toolbar
- **Italic**: Click the I button in the toolbar
- **Colors**: Use the color pickers for text and background

### Exporting Data
- Click the "Export" dropdown in the spreadsheet toolbar
- Choose your preferred format (CSV, TSV, JSON, or HTML)
- Files will download automatically

### Collaboration
- Share the spreadsheet URL with others
- See live cursors and presence indicators
- All changes sync in real-time

## 🔧 Development Scripts

```bash
# Development with automatic cleanup
npm run dev

# Force cleanup and start dev server
npm run dev:force

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add your Firebase environment variables
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the `[Looks like the result wasn't safe to show. Let's switch things up and try something else!]`.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Firebase](https://firebase.google.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Typography powered by [Inter](https://rsms.me/inter/)

## 📞 Support

If you find this project helpful, please give it a ⭐ on GitHub!

For issues or questions, please open an issue on the [GitHub repository](https://github.com/TarlanaVikas/Live-Grid/issues).
```

