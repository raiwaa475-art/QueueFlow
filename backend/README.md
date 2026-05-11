# QueueFlow Backend

The core API for the QueueFlow system, built with NestJS and Prisma.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)

### Installation
```bash
cd backend
npm install
```

### Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
PORT=3005
```

### Prisma Setup
```bash
npx prisma generate
```

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## 🛠️ Key Technologies
- **Framework:** NestJS
- **ORM:** Prisma
- **Auth:** Passport JWT (Supabase Integration)
- **Validation:** Class-validator
- **Database:** PostgreSQL (Supabase)
