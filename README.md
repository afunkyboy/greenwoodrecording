# Greenwood Recording Studio - Booking System

A modern client acquisition and booking system for Greenwood Recording Studio, built with Vue 3, JavaScript, Vite, and Supabase.

## Features

- **Client Booking Form**: A simple and intuitive form for clients to select multiple dates, provide project details, and submit booking requests.
- **Admin Dashboard**: A secure, role-based admin panel to manage bookings, view client information, and oversee studio availability.
- **Interactive Calendar**: A full-featured calendar in the admin dashboard to visualize bookings and manage availability.
- **Real-time Updates**: Built with Supabase for real-time data synchronization.
- **Notifications**: Automatic email notifications for booking confirmations and status updates.

## Tech Stack

- **Frontend**: Vue 3, JavaScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js 16+
- A Supabase account (free tier is sufficient)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/greenwood-recording.git
cd greenwood-recording
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Then, fill in the required values in your new `.env` file:

- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous public key.
- `VITE_ADMIN_PASSWORD`: A secure password for the admin login.

### 4. Set Up Supabase

1.  **Create a Project**: Go to [supabase.com](https://supabase.com), create a new project, and find your API URL and anon key in the **Project Settings > API** section.
2.  **Run Migrations**: Navigate to the **SQL Editor** in your Supabase project and execute the script from `supabase/migrations/001_initial_schema.sql` to create the necessary tables.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.

Utility scripts (run with Node):

- `node scripts/create-admin.js --email <email> --password <password>`: Create an admin user in Supabase (requires `SUPABASE_SERVICE_KEY` in `.env`).
- `node scripts/seed-test-bookings.js <supabase-url> <supabase-anon-key>`: Seed some test bookings.

## Project Structure

```
/src
|-- assets/         # Static assets (images, fonts)
|-- components/     # Reusable Vue components
|-- composables/    # Shared logic (e.g., useBookings)
|-- lib/            # Supabase client configuration
|-- router/         # Vue Router setup
|-- views/          # Page-level components
```

## License

This project is licensed under the MIT License.
