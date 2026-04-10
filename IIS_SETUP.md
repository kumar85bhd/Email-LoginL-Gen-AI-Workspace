# IIS Hosting Guide for Full-Stack Node.js App

This application is a full-stack Node.js app (Express + React/Vite). To host it on Windows IIS, the recommended approach is using IIS as a **Reverse Proxy**.

## 1. Prerequisites
Ensure the following are installed on your Windows Server:
*   **Node.js**: Installed and added to the system PATH.
*   **IIS**: Enabled via "Turn Windows features on or off".
*   **IIS URL Rewrite Module**: [Download here](https://www.iis.net/downloads/microsoft/url-rewrite).
*   **Application Request Routing (ARR) 3.0**: [Download here](https://www.iis.net/downloads/microsoft/application-request-routing).

## 2. Prepare the Application
1.  **Build the Frontend**:
    Run the following command in the project root:
    ```bash
    npm run build
    ```
    This creates the `dist` folder.

2.  **Environment Variables**:
    Ensure `NODE_ENV=production` is set in your production environment.

## 3. Configure IIS as a Reverse Proxy
1.  **Enable Proxying in IIS**:
    *   Open **IIS Manager**.
    *   Select your **Server node**.
    *   Double-click **Application Request Routing Cache**.
    *   Click **Server Proxy Settings** in the right pane.
    *   Check **Enable proxy** and click **Apply**.

2.  **Create the IIS Site**:
    *   Right-click **Sites** -> **Add Website**.
    *   Point the **Physical path** to this project root folder.
    *   Set your desired binding (e.g., Port 80).

3.  **Deployment Configuration (`web.config`)**:
    Create a `web.config` file in the root of your project (see the template below).

## 4. Manage the Node.js Process
Use **PM2** to keep the backend running:
1.  Install PM2: `npm install pm2 -g`
2.  Start the app: `pm2 start "npx tsx server.ts" --name "workspace-app"`
3.  Ensure it starts on boot: `pm2 save` and `pm2 startup`

---

## web.config Template
Save this as `web.config` in your project root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <!-- Optional: Increase request limits if needed -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="104857600" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```
