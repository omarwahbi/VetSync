# VetSync

VetSync is a comprehensive veterinary clinic management system designed to help clinics streamline their operations, manage patient records, and improve client communication.

## Features

- **Patient Management**: Track pet health records, vaccination schedules, and treatment history
- **Appointment Scheduling**: Manage clinic appointments and visits
- **Automated Reminders**: Send WhatsApp reminders to pet owners about upcoming appointments
- **Clinic Management**: Handle clinic subscriptions and resource limits
- **Multilingual Support**: Available in multiple languages including Arabic

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Database**: Prisma ORM
- **Messaging**: Twilio API for WhatsApp notifications
- **Scheduling**: NestJS scheduling for automated reminders

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Twilio account for WhatsApp messaging

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-organization/pet-well-app.git
cd pet-well-app
```

2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if applicable)
cd ../frontend
npm install
```

3. Configure environment variables

```bash
# Create .env file in the backend directory
cp .env.example .env
```

4. Update the .env file with your configuration:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vetsync

# Twilio (for WhatsApp reminders)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
```

5. Run database migrations

```bash
npx prisma migrate dev
```

6. Start the development server

```bash
# Backend
npm run start:dev

# Frontend (if applicable)
cd ../frontend
npm run dev
```

## Development

### Project Structure

```
pet-well-app/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── clinic/       # Clinic management
│   │   ├── pet/          # Pet records
│   │   ├── owner/        # Pet owner management
│   │   ├── reminder/     # Appointment reminder system
│   │   ├── prisma/       # Database connection
│   │   └── ...
├── frontend/             # Frontend application (if applicable)
└── README.md
```

## License

[MIT License](LICENSE)
