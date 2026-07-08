# Private Poker Club - Backend Implementation v 18.0cdefghi
3

A full-stack Next.js application for managing a private poker club with user authentication, event management, and admin functionality.

## 🚀 Features ---

### Authentication & User Management
- User registration with first name, last name, email, phone number, and notes
- Secure JWT-based authentication with bcrypt password hashing
- User profile management
- Session management with HTTP-only cookies

### Event Management
- Create, view, and manage poker events
- Event types: Cash games and tournaments
- Automatic event archiving when events pass
- Registration system with seat availability tracking
- Race condition protection for event registration

### Admin Features
- Admin-only routes protected by middleware
- Create, edit, and archive events
- View all registered players per event
- Remove players from events
- Edit user phone numbers
- View full user details (email, phone, notes)

### Notifications
- Email notifications via Resend
- Signup confirmation emails
- Event registration confirmation emails
- Toast notifications for user feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with custom implementation
- **Email**: Resend API
- **Notifications**: react-hot-toast
- **Password Hashing**: bcrypt
- **Validation**: Server-side validation with Mongoose schemas

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pocker-club-hub-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure your variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/poker-club
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Admin Configuration
   ADMIN_EMAIL=timothy@example.com
   
   # Email Configuration (Resend)
   RESEND_API_KEY=your-resend-api-key-here
   FROM_EMAIL=noreply@yourpokerclub.com
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env.local` file
   - The database will be created automatically on first connection

5. **Set up Resend for emails**
   - Sign up at [Resend](https://resend.com)
   - Create an API key
   - Update `RESEND_API_KEY` in your `.env.local` file
   - Configure your `FROM_EMAIL` address

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `PUT /api/users/profile` - Update user profile

### Events
- `GET /api/events` - Get all events (with optional status filter)
- `GET /api/events/[id]` - Get specific event
- `POST /api/events/[id]/register` - Register for event
- `DELETE /api/events/[id]/register` - Unregister from event

### Admin
- `POST /api/admin/events` - Create event (admin only)
- `PUT /api/admin/events/[id]` - Update event (admin only)
- `DELETE /api/admin/events/[id]` - Archive event (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/[id]/phone` - Update user phone (admin only)
- `DELETE /api/admin/events/[id]/players/[playerId]` - Remove player from event (admin only)

## 🔐 Admin Setup

The admin user is determined by the `ADMIN_EMAIL` environment variable. Only users with this email address will have admin privileges. There is no role field in the database - admin status is checked by comparing the user's email with the `ADMIN_EMAIL` environment variable.

## 📧 Email Templates

The application includes pre-built email templates for:
- Signup confirmation
- Event registration confirmation
- Event reminders (24 hours before)

## 🚨 Error Handling

The application includes comprehensive error handling for:
- Duplicate email registration
- Duplicate event registration
- Event full capacity
- Unauthorized access
- Expired events
- Validation errors
- Race conditions in event registration

## 🧪 Testing

To test the application:

1. **Create a regular user account**
   - Register with any email except the admin email
   - Test event registration and profile updates

2. **Create an admin account**
   - Register with the email specified in `ADMIN_EMAIL`
   - Access admin features at `/admin` routes

3. **Test edge cases**
   - Try registering for full events
   - Test duplicate registrations
   - Verify event auto-archiving
   - Test admin permissions

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Update `NEXT_PUBLIC_APP_URL` to your production URL
   - Ensure `JWT_SECRET` is secure and unique
   - Configure production MongoDB and Resend settings

3. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Other platforms that support Next.js

## 🔒 Security Features

- JWT tokens with 7-day expiration
- HTTP-only cookies for token storage
- Bcrypt password hashing with salt rounds
- Input validation and sanitization
- Admin route protection via middleware
- Race condition protection for event registration
- CORS protection
- Environment variable protection

## 📋 Database Schema

### User Model
- firstName (required, max 50 chars)
- lastName (required, max 50 chars)
- email (required, unique, validated)
- phoneNumber (required, validated)
- notes (optional, max 500 chars)
- password (required, min 6 chars, hashed)
- createdAt, updatedAt (timestamps)

### Event Model
- title (required, max 100 chars)
- dateTime (required)
- location (required, max 200 chars)
- buyInMin, buyInMax (required, validated)
- maxPlayers (required, 1-100)
- eventType (required: 'cash' | 'tournament')
- blinds (optional, max 50 chars)
- status ('ACTIVE' | 'ARCHIVED')
- registeredPlayers (array of User references)
- invitedPlayers (array of User references)
- seatsAvailable (optional, number)
- announcementSent (optional, boolean)
- createdAt, updatedAt (timestamps)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.
