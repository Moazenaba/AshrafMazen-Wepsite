import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Supabase PostgreSQL Connection
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.uzdgvdovssrvaewfewkx:Moaz-01092820802@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Ensure database schema and default tables exist
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 1,
        color TEXT DEFAULT 'emerald',
        icon TEXT DEFAULT 'BookOpen',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Series
    await client.query(`
      CREATE TABLE IF NOT EXISTS series (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Lessons
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        lesson_number INTEGER NOT NULL,
        youtube_url TEXT DEFAULT '',
        audio_url TEXT DEFAULT '',
        transcript TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'published',
        published_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Admin Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed default categories if table is empty
    const catCheck = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      const defaultCategories = [
        ['cat-1', 'العقيدة', 'aqeedah', 'علم التوحيد والإيمان ومسائل أصول الدين على منهج أهل السنة والجماعة', 1, 'emerald', 'BookOpen'],
        ['cat-2', 'الفقه', 'fiqh', 'الأحكام الشرعية العملية في أبواب العبادات والمعاملات وفقه النوازل', 2, 'amber', 'BookOpen'],
        ['cat-3', 'أصول الفقه', 'usul-fiqh', 'قواعد الاستنباط والأدلة الشرعية ومناهج الاجتهاد والفتوى', 3, 'sky', 'BookOpen'],
        ['cat-4', 'المصطلح', 'mustalah', 'علوم الحديث الشريف وقواعد قبول الروايات ونقد الأسانيد والمتون', 4, 'indigo', 'BookOpen'],
        ['cat-5', 'الخطب', 'khutab', 'خطب الجمع والمواعظ التوجيهية وتزكية القلوب والسلوك', 5, 'teal', 'BookOpen']
      ];
      for (const [id, name, slug, desc, sort, color, icon] of defaultCategories) {
        await client.query(
          `INSERT INTO categories (id, name, slug, description, sort_order, color, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING;`,
          [id, name, slug, desc, sort, color, icon]
        );
      }
    }

    // Seed demo admin if table is empty
    const adminCheck = await client.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO admin_users (id, email, password, name, role)
        VALUES ('admin-1', 'admin@example.com', 'admin123', 'مدير النظام', 'superadmin')
        ON CONFLICT (email) DO NOTHING;
      `);
    }

    await client.query('COMMIT');
    console.log('✓ Supabase database schema initialized & connected.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization error:', err);
  } finally {
    client.release();
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '20mb' }));

  // Transparent Supabase API Proxy for same-origin client requests
  app.use('/supabase-proxy', async (req, res) => {
    const targetBase =
      process.env.VITE_SUPABASE_URL || 'https://uzdgvdovssrvaewfewkx.supabase.co';
    const targetUrl = targetBase + req.url;
    try {
      const fetchHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k !== 'host' && k !== 'content-length' && typeof v === 'string') {
          fetchHeaders[k] = v;
        }
      }
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: fetchHeaders,
        body:
          req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0
            ? JSON.stringify(req.body)
            : undefined,
      });

      res.status(response.status);
      response.headers.forEach((val, key) => {
        if (key !== 'content-encoding' && key !== 'transfer-encoding') {
          res.setHeader(key, val);
        }
      });
      const data = await response.arrayBuffer();
      res.send(Buffer.from(data));
    } catch (err: any) {
      console.error('Supabase proxy error:', err);
      res.status(502).json({ error: 'Supabase proxy error', message: err.message });
    }
  });

  // Initialize DB tables
  await initDatabase();

  /**
   * ============================================================================
   * REST API ROUTES (Connected to Supabase PostgreSQL)
   * ============================================================================
   */

  // Health & connection check
  app.get('/api/health', async (_req, res) => {
    try {
      const dbRes = await pool.query('SELECT NOW() as now, version() as version');
      res.json({
        status: 'ok',
        database: 'Supabase PostgreSQL connected',
        now: dbRes.rows[0].now,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // ---------------- CATEGORIES ----------------
  app.get('/api/categories', async (_req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', async (req, res) => {
    const { id, name, slug, description, sort_order, color, icon } = req.body;
    const catId = id || `cat-${Date.now()}`;
    try {
      const result = await pool.query(
        `INSERT INTO categories (id, name, slug, description, sort_order, color, icon, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *;`,
        [catId, name, slug, description || '', sort_order || 1, color || 'emerald', icon || 'BookOpen']
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, sort_order, color, icon } = req.body;
    try {
      const result = await pool.query(
        `UPDATE categories
         SET name = COALESCE($1, name),
             slug = COALESCE($2, slug),
             description = COALESCE($3, description),
             sort_order = COALESCE($4, sort_order),
             color = COALESCE($5, color),
             icon = COALESCE($6, icon),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *;`,
        [name, slug, description, sort_order, color, icon, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- SERIES ----------------
  app.get('/api/series', async (req, res) => {
    const { category_id } = req.query;
    try {
      let query = 'SELECT * FROM series';
      const params: any[] = [];
      if (category_id) {
        query += ' WHERE category_id = $1';
        params.push(category_id);
      }
      query += ' ORDER BY sort_order ASC, created_at DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/series', async (req, res) => {
    const { id, category_id, title, slug, description, sort_order } = req.body;
    const seriesId = id || `series-${Date.now()}`;
    try {
      const result = await pool.query(
        `INSERT INTO series (id, category_id, title, slug, description, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *;`,
        [seriesId, category_id, title, slug, description || '', sort_order || 1]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/series/:id', async (req, res) => {
    const { id } = req.params;
    const { category_id, title, slug, description, sort_order } = req.body;
    try {
      const result = await pool.query(
        `UPDATE series
         SET category_id = COALESCE($1, category_id),
             title = COALESCE($2, title),
             slug = COALESCE($3, slug),
             description = COALESCE($4, description),
             sort_order = COALESCE($5, sort_order),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *;`,
        [category_id, title, slug, description, sort_order, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Series not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/series/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM series WHERE id = $1', [id]);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- LESSONS ----------------
  app.get('/api/lessons', async (req, res) => {
    const { includeDrafts, series_id, limit, search, bookmarkedIds } = req.query;
    try {
      let query = `
        SELECT l.*, 
               row_to_json(s.*) as series,
               row_to_json(c.*) as category
        FROM lessons l
        LEFT JOIN series s ON l.series_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (includeDrafts !== 'true') {
        query += " AND l.status = 'published'";
      }

      if (series_id) {
        params.push(series_id);
        query += ` AND l.series_id = $${params.length}`;
      }

      if (bookmarkedIds) {
        const ids = String(bookmarkedIds).split(',').filter(Boolean);
        if (ids.length > 0) {
          params.push(ids);
          query += ` AND l.id = ANY($${params.length}::text[])`;
        } else {
          return res.json([]);
        }
      }

      if (search && String(search).trim()) {
        params.push(`%${String(search).trim()}%`);
        const pIdx = params.length;
        query += ` AND (l.title ILIKE $${pIdx} OR l.transcript ILIKE $${pIdx} OR s.title ILIKE $${pIdx})`;
      }

      query += ' ORDER BY l.lesson_number ASC, l.published_at DESC';

      if (limit && Number(limit) > 0) {
        params.push(Number(limit));
        query += ` LIMIT $${params.length}`;
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { includeDrafts } = req.query;
    try {
      let query = `
        SELECT l.*, 
               row_to_json(s.*) as series,
               row_to_json(c.*) as category
        FROM lessons l
        LEFT JOIN series s ON l.series_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE l.id = $1
      `;
      if (includeDrafts !== 'true') {
        query += " AND l.status = 'published'";
      }
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/lessons', async (req, res) => {
    const {
      id,
      series_id,
      title,
      lesson_number,
      youtube_url,
      audio_url,
      transcript,
      status,
      published_at,
    } = req.body;
    const lessonId = id || `lesson-${Date.now()}`;
    try {
      const result = await pool.query(
        `INSERT INTO lessons (
           id, series_id, title, lesson_number, youtube_url, audio_url,
           transcript, status, published_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), NOW())
         RETURNING *;`,
        [
          lessonId,
          series_id,
          title,
          lesson_number || 1,
          youtube_url || '',
          audio_url || '',
          transcript || '',
          status || 'published',
          published_at || new Date().toISOString(),
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const {
      series_id,
      title,
      lesson_number,
      youtube_url,
      audio_url,
      transcript,
      status,
      published_at,
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE lessons
         SET series_id = COALESCE($1, series_id),
             title = COALESCE($2, title),
             lesson_number = COALESCE($3, lesson_number),
             youtube_url = COALESCE($4, youtube_url),
             audio_url = COALESCE($5, audio_url),
             transcript = COALESCE($6, transcript),
             status = COALESCE($7, status),
             published_at = COALESCE($8, published_at),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *;`,
        [
          series_id,
          title,
          lesson_number,
          youtube_url,
          audio_url,
          transcript,
          status,
          published_at,
          id,
        ]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- AUTHENTICATION ----------------
  app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query(
        'SELECT id, email, name, role FROM admin_users WHERE email = $1 AND password = $2',
        [email, password]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- RESET TO SEED ----------------
  app.post('/api/admin/reset-seed', async (_req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM lessons');
      await client.query('DELETE FROM series');
      await client.query('DELETE FROM categories');

      const defaultCategories = [
        ['cat-1', 'العقيدة', 'aqeedah', 'علم التوحيد والإيمان ومسائل أصول الدين على منهج أهل السنة والجماعة', 1, 'emerald', 'BookOpen'],
        ['cat-2', 'الفقه', 'fiqh', 'الأحكام الشرعية العملية في أبواب العبادات والمعاملات وفقه النوازل', 2, 'amber', 'BookOpen'],
        ['cat-3', 'أصول الفقه', 'usul-fiqh', 'قواعد الاستنباط والأدلة الشرعية ومناهج الاجتهاد والفتوى', 3, 'sky', 'BookOpen'],
        ['cat-4', 'المصطلح', 'mustalah', 'علوم الحديث الشريف وقواعد قبول الروايات ونقد الأسانيد والمتون', 4, 'indigo', 'BookOpen'],
        ['cat-5', 'الخطب', 'khutab', 'خطب الجمع والمواعظ التوجيهية وتزكية القلوب والسلوك', 5, 'teal', 'BookOpen']
      ];
      for (const [id, name, slug, desc, sort, color, icon] of defaultCategories) {
        await client.query(
          `INSERT INTO categories (id, name, slug, description, sort_order, color, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [id, name, slug, desc, sort, color, icon]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true, message: 'Database reset to default seed data' });
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  /**
   * ============================================================================
   * VITE MIDDLEWARE / STATIC ASSETS
   * ============================================================================
   */
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sheikh Ashraf Mazen Applet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
