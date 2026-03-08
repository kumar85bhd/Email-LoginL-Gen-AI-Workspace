import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, initDb, seedDb } from "./backend/database.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually if not loaded
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key.trim()]) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const ADMIN_CONFIG_PATH = path.join(__dirname, "admin_config.json");
const ADMIN_USER_PATH = path.join(__dirname, "admin_user.json");

const SSO_CERT_PATH = process.env.SSO_CERT_PATH;
const SSO_MOCK_MODE = process.env.VITE_SSO_MOCK_MODE === "true" || process.env.SSO_MOCK_MODE === "true" || !SSO_CERT_PATH;

let PUBLIC_KEY_CACHE: string | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("🚀 Starting Unified GenAI Workspace (Node.js Backend)...");
  
  // Cache Public Key
  if (!SSO_MOCK_MODE && SSO_CERT_PATH) {
      try {
          if (fs.existsSync(SSO_CERT_PATH)) {
              PUBLIC_KEY_CACHE = fs.readFileSync(SSO_CERT_PATH, 'utf-8');
              console.log("✅ Public key cached successfully.");
          } else {
              console.warn(`⚠️ Certificate file not found at ${SSO_CERT_PATH}`);
          }
      } catch (e) {
          console.error("❌ Error caching public key:", e);
      }
  }
  
  // Initialize Database
  await initDb();
  await seedDb();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Auth Middleware ---
  let adminEmailsCache: string[] = [];
  let lastAdminCacheUpdate = 0;
  const CACHE_TTL = 30000; // 30 seconds

  const getAdminEmails = () => {
    const now = Date.now();
    if (now - lastAdminCacheUpdate > CACHE_TTL || adminEmailsCache.length === 0) {
      try {
        if (fs.existsSync(ADMIN_USER_PATH)) {
          adminEmailsCache = JSON.parse(fs.readFileSync(ADMIN_USER_PATH, 'utf-8'));
          lastAdminCacheUpdate = now;
        }
      } catch (err) {
        console.error("Error reading admin_user.json:", err);
      }
    }
    return adminEmailsCache;
  };

  const authenticateToken = (req: any, res: any, next: any) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ detail: "Not identified" });
    
    req.user = { email: userEmail };
    
    // Check if admin
    const adminEmails = getAdminEmails();
    req.user.is_admin = adminEmails.includes(userEmail);
    
    if (SSO_MOCK_MODE && userEmail === "admin@company.com") {
        req.user.is_admin = true;
    }
    
    next();
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ detail: "Admin privileges required" });
    }
    next();
  };

  // --- API Routes ---

  /**
   * Authenticates a user via SSO token.
   * Phase 2: SSO Integration
   */
  app.get("/api/authenticate", async (req, res) => {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({ detail: "Token is missing" });
    }

    try {
      let email = "";
      let name = "";
      
      if (SSO_MOCK_MODE) {
        // Deterministic Mock Mode
        if (token === "mock-admin-token") {
            email = "admin@company.com";
            name = "Mock Admin";
        } else if (token === "mock-user-token") {
            email = "user@company.com";
            name = "Mock User";
        } else {
             return res.status(401).json({ detail: "Invalid mock token" });
        }
      } else {
        if (!PUBLIC_KEY_CACHE) {
             // Try to reload if missing (e.g. file appeared later)
             if (SSO_CERT_PATH && fs.existsSync(SSO_CERT_PATH)) {
                 PUBLIC_KEY_CACHE = fs.readFileSync(SSO_CERT_PATH, 'utf-8');
             } else {
                 console.error("SSO_CERT_PATH is not set or file missing");
                 return res.status(500).json({ detail: "Server configuration error" });
             }
        }

        const decoded: any = jwt.verify(token, PUBLIC_KEY_CACHE!, { algorithms: ["RS256"] });
        email = decoded.email;
        name = decoded.name;
      }

      if (!email) {
        return res.status(400).json({ detail: "Email not found in token" });
      }

      const adminEmails = getAdminEmails();
      // In mock mode, we need to ensure admin@company.com is treated as admin
      // We can temporarily inject it into the check or rely on admin_user.json
      // For hardening, let's just check the list.
      // If mock mode, we might want to force admin status for the admin token?
      // The requirement says: "Ensure admin gating works using these mock emails"
      // This implies we should add admin@company.com to admin_user.json OR handle it here.
      // Let's handle it here for mock mode safety without modifying the file.
      
      let isAdmin = adminEmails.includes(email);
      
      if (SSO_MOCK_MODE && email === "admin@company.com") {
          isAdmin = true;
      }

      res.json({ email, isAdmin, name });
    } catch (err: any) {
      console.error("Authentication error:", err.message);
      res.status(401).json({ detail: "Invalid token" });
    }
  });

  app.get("/api/auth/session", authenticateToken, async (req: any, res) => {
    res.json({ email: req.user.email, is_admin: req.user.is_admin });
  });

  // Workspace Categories
  app.get("/api/workspace/categories", authenticateToken, async (req, res) => {
    try {
      if (!db.data) await db.read();
      const categories = [...db.data.categories].sort((a, b) => a.name.localeCompare(b.name));
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ detail: "Internal Server Error" });
    }
  });

  app.post("/api/workspace/categories", authenticateToken, isAdmin, async (req, res) => {
    const { name, slug, icon } = req.body;
    try {
      await db.read();
      const id = db.data.categories.length > 0 ? Math.max(...db.data.categories.map((c: any) => c.id)) + 1 : 1;
      const newCat = {
        id,
        name,
        slug,
        icon: icon || 'Folder',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.data.categories.push(newCat);
      await db.write();
      res.json(newCat);
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  app.put("/api/workspace/categories/:id", authenticateToken, isAdmin, async (req, res) => {
    const { name, slug, icon } = req.body;
    const id = parseInt(req.params.id);
    try {
      await db.read();
      const index = db.data.categories.findIndex((c: any) => c.id === id);
      if (index === -1) return res.status(404).json({ detail: "Category not found" });
      
      db.data.categories[index] = {
        ...db.data.categories[index],
        name,
        slug,
        icon: icon || 'Folder',
        updated_at: new Date().toISOString()
      };
      await db.write();
      res.json(db.data.categories[index]);
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  app.delete("/api/workspace/categories/:id", authenticateToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await db.read();
      const initialLength = db.data.categories.length;
      db.data.categories = db.data.categories.filter((c: any) => c.id !== id);
      if (db.data.categories.length === initialLength) return res.status(404).json({ detail: "Category not found" });
      await db.write();
      res.json({ message: "Category deleted" });
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  // Workspace Apps
  app.get("/api/workspace/apps", authenticateToken, async (req, res) => {
    try {
      if (!db.data) await db.read();
      
      const includeInactive = req.query.all === 'true';
      
      let apps = db.data.workspace_apps;
      if (!includeInactive) {
        apps = apps.filter((a: any) => a.is_active);
      }

      const mappedApps = apps.map((app: any) => {
        const category = db.data.categories.find((c: any) => c.id === app.category_id);
        return {
          ...app,
          category: category ? category.name : 'Uncategorized',
          desc: app.description,
          keyFeatures: app.key_features,
          metricsEnabled: !!app.metrics_enabled,
          totalLaunches: app.total_launches || 0,
          baseActivity: 'System: Active',
          isFavorite: false,
          metrics: '94/100',
          status: 'Healthy',
          lastUsed: new Date().toISOString()
        };
      });

      mappedApps.sort((a: any, b: any) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      });

      res.json(mappedApps);
    } catch (error: any) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ detail: "Internal Server Error" });
    }
  });

  app.post("/api/workspace/apps", authenticateToken, isAdmin, async (req, res) => {
    const { name, slug, category_id, icon, url, description, key_features, display_order, is_active, metrics_enabled } = req.body;
    try {
      await db.read();
      const id = db.data.workspace_apps.length > 0 ? Math.max(...db.data.workspace_apps.map((a: any) => a.id)) + 1 : 1;
      const newApp = {
        id,
        name,
        slug,
        category_id: parseInt(category_id),
        icon,
        url: url?.toString() || '',
        description,
        key_features: key_features || '',
        display_order: display_order || 0,
        is_active: !!is_active,
        metrics_enabled: !!metrics_enabled,
        total_launches: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.data.workspace_apps.push(newApp);
      await db.write();
      res.json(newApp);
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  app.put("/api/workspace/apps/:id", authenticateToken, isAdmin, async (req, res) => {
    const { name, slug, category_id, icon, url, description, key_features, display_order, is_active, metrics_enabled } = req.body;
    const id = parseInt(req.params.id);
    try {
      await db.read();
      const index = db.data.workspace_apps.findIndex((a: any) => a.id === id);
      if (index === -1) return res.status(404).json({ detail: "App not found" });

      db.data.workspace_apps[index] = {
        ...db.data.workspace_apps[index],
        name,
        slug,
        category_id: parseInt(category_id),
        icon,
        url: url?.toString() || '',
        description,
        key_features: key_features || '',
        display_order: display_order || 0,
        is_active: !!is_active,
        metrics_enabled: !!metrics_enabled,
        updated_at: new Date().toISOString()
      };
      await db.write();
      res.json(db.data.workspace_apps[index]);
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  app.delete("/api/workspace/apps/:id", authenticateToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await db.read();
      const initialLength = db.data.workspace_apps.length;
      db.data.workspace_apps = db.data.workspace_apps.filter((a: any) => a.id !== id);
      if (db.data.workspace_apps.length === initialLength) return res.status(404).json({ detail: "App not found" });
      await db.write();
      res.json({ message: "App deleted" });
    } catch (e: any) {
      res.status(400).json({ detail: e.message });
    }
  });

  app.post("/api/workspace/apps/:id/launch", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await db.read();
      const index = db.data.workspace_apps.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        db.data.workspace_apps[index].total_launches = (db.data.workspace_apps[index].total_launches || 0) + 1;
        await db.write();
      }
      res.json({ status: "ok" });
    } catch {
      // Fail silently
      res.json({ status: "ok" });
    }
  });

  // Admin Dashboard Links
  const readAdminConfig = () => {
    try {
      if (fs.existsSync(ADMIN_CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, 'utf-8'));
      }
    } catch {
      // Ignore read errors, return default
    }
    return { dashboard_links: [] };
  };

  const writeAdminConfig = (config: any) => {
    fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2));
  };

  app.get("/api/admin/dashboard-links", authenticateToken, isAdmin, (req, res) => {
    const config = readAdminConfig();
    res.json(config.dashboard_links || []);
  });

  app.post("/api/admin/dashboard-links", authenticateToken, isAdmin, (req, res) => {
    const config = readAdminConfig();
    const newLink = { ...req.body, id: crypto.randomUUID() };
    config.dashboard_links = [...(config.dashboard_links || []), newLink];
    writeAdminConfig(config);
    res.json(newLink);
  });

  app.put("/api/admin/dashboard-links/:id", authenticateToken, isAdmin, (req, res) => {
    const config = readAdminConfig();
    const index = (config.dashboard_links || []).findIndex((l: any) => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ detail: "Link not found" });
    }
    config.dashboard_links[index] = { ...config.dashboard_links[index], ...req.body, id: req.params.id };
    writeAdminConfig(config);
    res.json(config.dashboard_links[index]);
  });

  app.delete("/api/admin/dashboard-links/:id", authenticateToken, isAdmin, (req, res) => {
    const config = readAdminConfig();
    const initialLength = config.dashboard_links?.length || 0;
    config.dashboard_links = (config.dashboard_links || []).filter((l: any) => l.id !== req.params.id);
    if (config.dashboard_links.length === initialLength) {
      return res.status(404).json({ detail: "Link not found" });
    }
    writeAdminConfig(config);
    res.json({ message: "Link deleted" });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "node-express" });
  });

  // --- Frontend Serving ---
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Serving production build...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ Unified Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("💥 Fatal error during startup:", err);
  process.exit(1);
});
