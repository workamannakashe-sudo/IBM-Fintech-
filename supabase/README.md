# 🚀 BudgetMitra — Supabase Backend Setup

This directory contains the production-ready PostgreSQL schema and Row Level Security (RLS) policies for BudgetMitra.

---

## ⚡ 2-Minute Quick Setup

1. **Create a Supabase Project**:
   - Go to [database.new](https://database.new) and create a free PostgreSQL project.

2. **Run the SQL Schema**:
   - Navigate to the **SQL Editor** in your Supabase Dashboard.
   - Copy the contents of [`schema.sql`](./schema.sql) and paste it into the editor.
   - Click **Run** (`Cmd/Ctrl + Enter`).

3. **Connect to BudgetMitra**:
   - In your Supabase Project Settings, go to **API**.
   - Copy your **Project URL** and **anon public Key**.
   - Create a `.env` file in the project root:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

---

## 🛡️ Security Architecture

| Feature | Implementation | Guarantee |
|---------|---------------|-----------|
| **Row Level Security** | Enabled on 100% of tables | Users can never read or mutate other users' records |
| **Auth Integration** | Foreign key to `auth.users` with `ON DELETE CASCADE` | Clean GDPR/privacy data wiping upon account deletion |
| **Zero-Knowledge SMS** | Parsing is purely client-side | Raw SMS is never transmitted or stored in the database |
| **Masked PII** | Card/account numbers stored as `XXXXX1234` | Minimal sensitive data exposure |
| **Auto-Indexing** | Composite indexes on `(user_id, date)` | Instant query times even with thousands of transactions |
