# AI-Powered CV Generator

A modern, professional CV generator built with Turborepo monorepo architecture, featuring AI-powered content enhancement using Google Gemini.

## 🚀 Features

- **Turborepo Monorepo**: Scalable architecture with shared packages
- **AI-Powered Enhancement**: Intelligent content rewriting and suggestions using Google Gemini
- **Step-by-Step Wizard**: Intuitive form flow with real-time validation
- **Live Preview**: Real-time CV preview with completeness scoring
- **Dark/Light Mode**: Beautiful themes with smooth transitions
- **Local Storage**: Automatic draft saving and restoration
- **Import/Export**: JSON-based data portability
- **Responsive Design**: Works perfectly on all devices
- **TypeScript**: Full type safety across the entire codebase

## 🏗️ Architecture

```
cv-generator-monorepo/
├── apps/
│   ├── web/          # Next.js 14 frontend application
│   └── api/          # Express.js backend API
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   ├── ui/           # Shared UI components (shadcn/ui)
│   └── lib-ai/       # AI integration wrapper (Gemini)
└── turbo.json        # Turborepo configuration
```

## 🛠️ Tech Stack

### Frontend (apps/web)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **next-themes** - Dark/light mode support

### Backend (apps/api)
- **Express.js** - Web framework
- **TypeScript** - Type-safe server development
- **Google Gemini AI** - AI content enhancement
- **Express Rate Limit** - API protection
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Shared Packages
- **@cv-generator/types** - Shared TypeScript interfaces
- **@cv-generator/utils** - Common utility functions
- **@cv-generator/ui** - Reusable UI components
- **@cv-generator/lib-ai** - AI integration wrapper

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 10+
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cv-generator-monorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   **Backend (.env in apps/api/)**
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   
   Edit `apps/api/.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Frontend (.env.local in apps/web/)**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   
   Edit `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔑 Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 📖 Usage

### Creating a CV

1. **Experience Level**: Choose between Fresh Graduate or Professional
2. **Personal Information**: Fill in contact details
3. **Professional Summary**: Write or generate AI-enhanced summary
4. **Work Experience**: Add positions with AI-enhanced descriptions
5. **Education**: Add educational background
6. **Skills**: Add skills with AI suggestions
7. **Projects**: Showcase your work and contributions

### AI Features

- **Experience Enhancement**: Improve job descriptions with professional language
- **Summary Generation**: Create compelling professional summaries
- **Skills Suggestions**: Get relevant skill recommendations
- **Content Optimization**: AI-powered content improvements

### Data Management

- **Auto-save**: Your progress is automatically saved to local storage
- **Export**: Download your CV data as JSON
- **Import**: Upload previously exported CV data
- **Preview**: Real-time CV preview with completeness scoring

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start all development servers
npm run build        # Build all packages and apps
npm run lint         # Lint all packages
npm run type-check   # Type check all packages

# Individual package commands
npm run dev --workspace=@cv-generator/web    # Start frontend only
npm run dev --workspace=@cv-generator/api    # Start backend only
```

### Project Structure

```
apps/web/
├── app/
│   ├── components/
│   │   ├── cv-wizard/     # Step-by-step form components
│   │   ├── cv-preview/    # CV preview and scoring
│   │   └── ui/            # UI components
│   ├── providers/         # Theme and context providers
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/                # Static assets
└── next.config.js         # Next.js configuration

apps/api/
├── src/
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   └── index.ts           # Server entry point
└── .env.example           # Environment variables template

packages/
├── types/                 # Shared TypeScript types
├── utils/                 # Utility functions
├── ui/                    # UI component library
└── lib-ai/                # AI integration
```

## 🔒 Security Features

- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Input Validation**: All user inputs are validated and sanitized
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Security headers for Express.js
- **Environment Variables**: Sensitive data stored securely

## 🎨 Design System

The application uses a comprehensive design system with:

- **Color Palette**: Professional blue and purple gradients
- **Typography**: Inter font with proper hierarchy
- **Spacing**: 8px grid system
- **Components**: Consistent shadcn/ui components
- **Animations**: Smooth Framer Motion transitions
- **Responsive**: Mobile-first design approach

## 📱 Responsive Design

- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Enhanced for tablets (768px+)
- **Desktop**: Full experience (1024px+)
- **Large Screens**: Optimized layouts (1440px+)

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Connect your repository
2. Set environment variables
3. Deploy with automatic builds

### Backend (Railway/Heroku)
1. Connect your repository
2. Set environment variables including `GEMINI_API_KEY`
3. Deploy with automatic builds

### Environment Variables for Production
```env
# Backend
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
GEMINI_API_KEY=your_production_gemini_key

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Turborepo](https://turbo.build/) for monorepo tooling
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](README.md)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new)

---

Built with ❤️ using modern web technologies and AI-powered enhancement.