To set up and run the project, follow the instructions below:

### Step 1: Add `.env` File

Create a `.env` file in the root of your project directory and add the following environment variables:

```plaintext
DATABASE_USER_NAME=<your_mongo_db_username>
DATABASE_PASSWORD=<your_mongo_db_password>
DATABASE_NAME=<your_mongo_db_name>
JWT_SECRET=<your_jwt_secret> 
 
```

Replace the following placeholders with actual values:

- `<your_mongo_db_username>`: The MongoDB username.
- `<your_mongo_db_password>`: The MongoDB password.
- `<your_mongo_db_name>`: The name of your MongoDB database.
- `<your_jwt_secret>`: The jwt secrete  you can Generate from  https://jwtsecret.com/generate

### Step 2: Create MongoDB Cluster and Add Credentials

1. **Create a MongoDB Atlas account:**

   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a new account if you don't already have one.

2. **Create a Cluster:**

   - After logging in, click on "Build a Cluster" and choose the free-tier cluster (M0).
   - Follow the prompts to select your cloud provider and region.

3. **Create a Database User:**

   - Go to the "Database Access" section in the left sidebar.
   - Click on "Add New Database User."
   - Set a username and password for your MongoDB user. You will use these credentials in the `.env` file.

4. **Whitelist Your IP Address:**

   - Go to the "Network Access" section in the left sidebar.
   - Click on "Add IP Address" and allow access from anywhere (or just your IP).

5. **Get the Connection String:**
   - Go to the "Clusters" section.
   - Click on "Connect" and then "Connect your application."
   - Copy the connection string provided and replace `<your_mongo_db_username>`, `<your_mongo_db_password>` and `<your_mongo_db_name>` in the `.env` file accordingly.

Your `.env` file should now have the credentials for your MongoDB Atlas cluster.

```javascript
const dbUsername = encodeURIComponent(process.env.DATABASE_USER_NAME);
const dbPassword = encodeURIComponent(process.env.DATABASE_PASSWORD);
const dbName = encodeURIComponent(process.env.DATABASE_NAME);

// The connection string using the credentials
const mongoURI = `mongodb+srv://${dbUsername}:${dbPassword}@${dbName}.mongodb.net/?retryWrites=true&w=majority`;
```

### Step 3: Install Dependencies

1. **Clone the repository:**
   If you haven't cloned the repository yet, do so with:

   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```

2. **Install Node.js Dependencies:**
   Inside the project directory, run:

   ```bash
   npm install
   ```

### Step 4: Install Docker (for Windows & Linux)

#### On Windows:

1. **Download Docker Desktop:**
   - Go to [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop) and download the installer.
   - Run the installer and follow the instructions to install Docker.
   - After installation, restart your system if prompted.
2. **Run Docker Desktop:**

   - Launch Docker Desktop and ensure it is running properly.

3. **Check Docker Installation:**
   Open a terminal (e.g., Command Prompt or PowerShell) and run the following command to check if Docker is installed correctly:

   ```bash
   docker --version
   ```

#### On Linux:

1. **Update Package Index:**

   ```bash
   sudo apt-get update
   ```

2. **Install Required Packages:**

   ```bash
   sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
   ```

3. **Add Docker’s Official GPG Key:**

   ```bash
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   ```

4. **Set Up the Stable Docker Repository:**

   ```bash
   sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   ```

5. **Install Docker:**

   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce
   ```

6. **Verify Installation:**

   ```bash
   docker --version
   ```

7. **Run Docker Without `sudo` (Optional):**

   To run Docker commands without `sudo`, add your user to the Docker group:

   ```bash
   sudo usermod -aG docker $USER
   ```

   Log out and log back in for changes to take effect.

### Step 5: Running Docker Compose

1. **Ensure `docker-compose.yml` exists** in your project directory. If not, create one to define your services (like MongoDB or the application itself).

  

2. **Start Docker Compose:**

   With Docker and Docker Compose installed, run the following command to start your containers:

   ```bash
   docker-compose up --build
   ```

   This will build your app container and start MongoDB.

3. **Access the Application:**
   Once the containers are up, your application should be accessible at `http://localhost:3000` in your browser.

---

### Step 6: Running the App Locally (Without Docker)

If you prefer to run the app locally without Docker, you can run:

1. **Start the Server:**

   ```bash
   npm run dev
   ```

2. **Access the Application:**
   Open your browser and go to `http://localhost:3000`.

That's it! You have successfully set up your environment and can start working with the API.
