# 🚀 Quick Setup Instructions

## 1. Create Environment File

Create a file called `.env.local` in your project root with this content:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_VLsGnIw52Kdp@ep-curly-thunder-ad0ecwkj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 2. Add to Vercel

In your Vercel dashboard:

1. Go to Settings → Environment Variables
2. Add `DATABASE_URL` with the same connection string

## 3. Test It

```bash
npm run dev
```

Visit http://localhost:9002 and try adding a member - it will be saved to your Neon database!

## ✅ You're All Set!

Your app now uses:

- ✅ Real PostgreSQL database
- ✅ Automatic table creation
- ✅ Demo data included
- ✅ Production-ready setup
