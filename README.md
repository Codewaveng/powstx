# POWtfolio

**One link. All your proof.**

POWtfolio is a platform for builders, creators, and contributors to showcase their Proof of Work (POW) with verifiable evidence.

## Features

- ✅ Unique POWtfolio link for each user (powtfolio.xyz/username)
- 🔍 Verifiable proof of work entries
- 🎨 Multiple customizable themes
- 🏆 Badge and reputation system
- 📊 Dashboard with analytics
- 🔐 Secure authentication
- 📱 Responsive design

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Template Engine**: EJS
- **Authentication**: bcryptjs, express-session
- **Styling**: Custom CSS with Font Awesome icons

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)

### Setup Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**

Edit the `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/powtfolio
SESSION_SECRET=your-secret-key-change-in-production
```

3. **Start MongoDB**

Make sure MongoDB is running on your machine:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or run directly
mongod
```

4. **Run the Application**

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

5. **Access the Application**

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
powtfolio/
├── models/           # MongoDB schemas
│   ├── User.js
│   ├── POW.js
│   └── Badge.js
├── routes/           # Express routes
│   ├── index.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── pow.js
│   └── profile.js
├── views/            # EJS templates
│   ├── index.ejs
│   ├── 404.ejs
│   ├── auth/
│   ├── dashboard/
│   ├── pow/
│   └── profile/
├── public/           # Static assets
│   ├── css/
│   ├── js/
│   └── uploads/
├── server.js         # Main application file
├── package.json
└── .env
```

## Usage

### Creating an Account

1. Navigate to `/auth/register`
2. Choose a unique username
3. Enter your email and password
4. Click "Create Account"

### Adding Proof of Work

1. Login to your dashboard
2. Click "Add POW"
3. Fill in the details:
   - Title
   - Description
   - Type (GitHub, Design, Article, etc.)
   - Proof link (optional)
   - Skills used
   - Date range
4. Click "Add POW"

### Customizing Your Profile

1. Go to Dashboard → Settings
2. Update your profile information
3. Add social links
4. Select a theme
5. Add your skills
6. Click "Save Changes"

### Sharing Your POWtfolio

Your public portfolio is available at:
```
http://localhost:3000/yourusername
```

Share this link on:
- Twitter/X
- LinkedIn
- GitHub
- Email signatures
- Discord

## Features Roadmap

### MVP (Current)
- ✅ User authentication
- ✅ POW entries
- ✅ Basic themes
- ✅ Badge system
- ✅ Public profiles

### V2 (Future)
- [ ] GitHub integration
- [ ] Figma integration
- [ ] Advanced verification
- [ ] Analytics dashboard
- [ ] Recruiter mode
- [ ] AI summaries

### V3 (Future)
- [ ] Talent marketplace
- [ ] On-chain proof
- [ ] DAO tooling
- [ ] Portable reputation
- [ ] Custom domains

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server on file changes.

### Database Seeding

To seed the database with sample data:

```javascript
// Create a seed.js file and run it
node seed.js
```

## Security Notes

1. **Change the SESSION_SECRET** in production
2. Use **environment variables** for sensitive data
3. Enable **HTTPS** in production
4. Implement **rate limiting** for API endpoints
5. Add **CSRF protection** for forms
6. Use **helmet.js** for security headers

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ for builders, creators, and contributors**
