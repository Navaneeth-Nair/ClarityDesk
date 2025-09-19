# Smart Productivity Dashboard - MySQL Setup Guide

## Prerequisites

1. **Install MySQL Server**
   - Download and install MySQL from https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP/MAMP for an all-in-one solution
   - Ensure MySQL service is running

2. **Verify MySQL Installation**
   ```bash
   mysql --version
   ```

## Database Setup Options

### Option 1: Automatic Setup (Recommended)
The application will automatically create the database and tables when you start the backend server.

1. Update the `.env` file in the backend directory:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=productivity_dashboard
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

### Option 2: Manual Setup
If you prefer to set up the database manually:

1. Login to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Run the setup script:
   ```sql
   source backend/database/setup.sql
   ```

3. Or copy and paste the SQL commands from `backend/database/setup.sql`

## Configuration

### Environment Variables
Create a `.env` file in the backend directory with your MySQL configuration:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=productivity_dashboard
DB_USER=root
DB_PASSWORD=your_password_here

# Socket.io Configuration
CORS_ORIGIN=http://localhost:3000

# Session Configuration
SESSION_SECRET=your-secret-key-here
```

### Common MySQL Configurations

**Local Development (Default):**
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: (your MySQL root password)

**XAMPP/WAMP:**
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: (usually empty for local development)

**Cloud/Remote MySQL:**
- Update host, port, user, and password accordingly
- Ensure your IP is whitelisted for remote connections

## Troubleshooting

### Connection Issues
1. **MySQL not running**: Start MySQL service
   - Windows: `net start mysql80` (or your MySQL version)
   - macOS: `brew services start mysql`
   - Linux: `sudo systemctl start mysql`

2. **Access denied**: Check username/password in `.env` file

3. **Database doesn't exist**: The app will create it automatically, or run the setup.sql script

4. **Port conflicts**: Change DB_PORT in `.env` if MySQL runs on a different port

### Testing Connection
Use the MySQL command line or a GUI tool like MySQL Workbench to verify your connection:

```bash
mysql -h localhost -P 3306 -u root -p
```

## Sample Data
The setup script includes sample users, tasks, and activities for demo purposes:

- **Users**: Alice_Designer, Bob_Developer, Charlie_PM
- **Tasks**: Various sample tasks with different priorities and deadlines
- **Focus Sessions**: Sample completed and in-progress sessions
- **Activity Log**: Sample user activities for productivity insights

## Production Notes
For production deployment:
1. Use a strong password for the database user
2. Create a dedicated database user (not root)
3. Use environment variables for all sensitive configuration
4. Enable SSL connections for remote databases
5. Regular database backups
