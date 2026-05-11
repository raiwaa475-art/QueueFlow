# QueueFlow Frontend

The client-side application for the QueueFlow system, built with Next.js 15.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3005 # Production: your_backend_url
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run start
```

## 🛠️ Key Technologies
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State Management:** React Context (Auth, Language)
- **Backend Communication:** Fetch API with JWT Bearer Auth
