# GenAI Workspace & Admin Platform

## 1. Project Overview
A unified React application combining a user-facing GenAI Workspace and an Admin Dashboard for platform management. Built with React, Vite, and Tailwind CSS.

## 2. Architecture Summary
- **Frontend**: React (TypeScript) + Vite
- **Backend**: Express (Node.js)
- **Database**: lowdb (JSON-based)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **State Management**: Context API (Auth)
- **Authentication**: SSO (JWT/RS256) + Header-Based Session
- **Modules**:
  - **Workspace**: User interface for AI tools.
  - **Admin**: Dashboard for system health monitoring and application management.

## 3. Tech Stack
- **React 18+**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React** (Icons)
- **Recharts** (Charts)
- **Express** (Backend)
- **lowdb** (Database)

## 4. Folder Structure
```
/backend
  data/             # JSON storage (workspace.json - Source of truth for users, categories, and apps)
  database.ts       # lowdb initialization and seeding logic
  src/
    auth_mgn/       # SSO Token Validation Logic
/src
  /modules
    /workspace      # User-facing module (Home, Favorites, Categories)
    /admin          # Admin dashboard module (System Health, App Management)
  /shared           # Shared components, hooks, contexts, services
  App.tsx           # Main application router and provider setup
  main.tsx          # Application entry point
```

## 5. How to Run Locally

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` file in the root directory based on `.env.example`.
    ```env
    # SSO Configuration
    VITE_SSO_URL=https://sso.example.com/login
    VITE_SSO_REDIRECT_URL=http://localhost:3000/workspace
    SSO_CERT_PATH=./backend/certs/public_key.pem
    VITE_SSO_MOCK_MODE=true
    ```
    *Note: For local development, `VITE_SSO_MOCK_MODE=true` allows bypassing real SSO token validation.*

3.  **Run the application**:
    ```bash
    npm run dev
    ```
    This starts the **Express backend** (which also serves the Vite frontend in development) automatically using a single Node.js entry point (`server.ts`).

## 6. SSO Authentication Architecture

The application uses a Single Sign-On (SSO) mechanism for authentication.

### Flow:
1.  **Unauthenticated User**: Redirected to `VITE_SSO_URL` with a `redirect_url` parameter.
2.  **SSO Provider**: Authenticates the user and redirects back to `VITE_SSO_REDIRECT_URL` with a `?token=<JWT>` parameter.
3.  **Frontend**:
    -   Extracts the token from the URL.
    -   Calls `GET /api/authenticate?token=<JWT>`.
4.  **Backend**:
    -   Validates the JWT signature using the public key at `SSO_CERT_PATH` (RS256).
    -   Extracts user email and name.
    -   Checks `workspace.json` to determine admin status.
    -   Returns user profile `{ email, isAdmin, name }`.
5.  **Session Management**:
    -   Frontend stores email and admin status in `sessionStorage`.
    -   Frontend attaches `X-User-Email` header to all subsequent API requests.
    -   Backend middleware (`authenticateToken`) validates the `X-User-Email` header for protected routes.

## 7. API Endpoints

### Authentication
-   `GET /api/authenticate`: Validate SSO token and get user profile.
-   `GET /api/auth/session`: Validate existing session (via header).

### Workspace (User Facing)
-   `GET /api/workspace/apps`: Get all workspace apps.
-   `GET /api/workspace/categories`: Get all categories.

### Admin (Management)
-   `GET /api/admin/dashboard-links`: Get all admin dashboard links.
-   `POST /api/admin/dashboard-links`: Create a new admin dashboard link.
-   `PUT /api/admin/dashboard-links/{id}`: Update an admin dashboard link.
-   `DELETE /api/admin/dashboard-links/{id}`: Delete an admin dashboard link.
-   `GET /api/admin/categories`: Manage system categories.
-   `POST /api/admin/categories`: Create a new category.
-   `PUT /api/admin/categories/{id}`: Update a category.
-   `DELETE /api/admin/categories/{id}`: Delete a category.
-   `GET /api/admin/workspace-apps`: Manage workspace applications.
-   `POST /api/admin/workspace-apps`: Create a new workspace app.
-   `PUT /api/admin/workspace-apps/{id}`: Update a workspace app.
-   `DELETE /api/admin/workspace-apps/{id}`: Delete a workspace app.

## 8. Build & Run Instructions

### Development
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run locally**:
    ```bash
    npm run dev
    ```
    This starts the backend server (using `tsx`) which also serves the Vite frontend in middleware mode.

### Production
1.  **Build Frontend**:
    ```bash
    npm run build
    ```
    This compiles the React application into the `dist/` directory.

2.  **Start Server**:
    ```bash
    npm start
    ```
    This runs `node server.ts` (using `tsx` or similar loader) to start the Express server. The server will automatically serve the static files from `dist/`.

    > **Note:** The backend is **not** compiled to a separate `dist/server.js` file. It runs directly from source to support TypeScript features at runtime.

## 9. Validation Rules
### Admin Dashboard Links & Workspace Apps
-   **Name**: Required. Allowed characters: Alphanumeric, spaces, `.` `,` `!` `?` `-` `_` `(` `)`.
-   **Description**: Optional (max 200 chars).
-   **URL**: Required. Must be a valid URL string.
-   **Category**: Required.

## 10. Role-Based Routing
- **Workspace**: Accessible to all authenticated users.
- **Admin**: Accessible only to users with the `is_admin` flag set to `true`.

## 11. Recent Updates
### Application Management (Phase 9 Update)
- **Unified Management**: Added a dedicated "Application Management" section in the Admin dashboard.
- **Tabs Interface**: Switch between managing "Workspace Apps" and "Categories" seamlessly.
- **Real-time Updates**: Changes made in the Admin dashboard are immediately reflected in the user-facing Workspace.
- **Category Management**: Full CRUD capabilities for categories, including icon selection (using Lucide icon names).

### UI & Component Enhancements
- **Dynamic Icon Rendering**: Implemented a `DynamicIcon` component that dynamically loads icons from `lucide-react` based on string names stored in the database.
- **Premium Hero**: Redesigned the Workspace hero section with glassmorphism and animated 3D-style illustrations.
- **Collapsible Sidebar**: Implemented a modern, space-efficient navigation sidebar that expands on hover.
