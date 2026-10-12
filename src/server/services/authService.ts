import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { generateToken, AuthenticatedUser } from '../middleware/auth';

export class AuthService {
  static async registerUser(data: {
    name: string;
    email: string;
    password: string;
    country?: string;
    budget?: number;
    skinTone?: string;
    undertone?: string;
  }) {
    const {
      name,
      email,
      password,
      country = 'Bangladesh',
      budget = 3000,
      skinTone = 'Medium',
      undertone = 'Warm',
    } = data;

    // Check if user already exists
    const [existing]: any = await pool.query(
      'SELECT user_id, email FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      throw new Error('User with this email already exists.');
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user with calibrated skin tone and undertone
    const userRole = email === 'admin@gmail.com' ? 'admin' : 'user';
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, country, budget, skin_tone, undertone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, userRole, country, budget, skinTone, undertone]
    );

    const userId = result.insertId;

    // Insert initial skin analysis entry so history is recorded
    try {
      await pool.query(
        'INSERT INTO skin_analysis (user_id, skin_tone, undertone, confidence_score, explanation) VALUES (?, ?, ?, ?, ?)',
        [userId, skinTone, undertone, 88.0, 'Registered complexion calibration profile']
      );
    } catch {}

    const authPayload: AuthenticatedUser = {
      userId,
      email,
      name,
      country,
      role: userRole,
    };

    const token = generateToken(authPayload);

    return {
      user: {
        userId,
        name,
        email,
        role: userRole,
        country,
        budget,
        skinTone,
        undertone,
      },
      token,
    };
  }

  static async loginUser(data: { email: string; password: string }) {
    const { email, password } = data;

    const [rows]: any = await pool.query(
      'SELECT user_id, name, email, password_hash, role, country, budget, skin_tone, undertone FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user = rows[0];
    const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const isMatch = (envAdminPassword && email === envAdminEmail && password === envAdminPassword) || (await bcrypt.compare(password, user.password_hash));

    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Update last login timestamp
    try {
      await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);
    } catch {}

    const role = user.role || (user.email === 'admin@gmail.com' ? 'admin' : 'user');

    const authPayload: AuthenticatedUser = {
      userId: user.user_id,
      email: user.email,
      name: user.name,
      country: user.country,
      role,
    };

    const token = generateToken(authPayload);

    return {
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role,
        country: user.country,
        budget: user.budget,
        skinTone: user.skin_tone || 'Medium',
        undertone: user.undertone || 'Warm',
      },
      token,
    };
  }

  static async getUserProfile(userId: number) {
    const [users]: any = await pool.query(
      'SELECT user_id, name, email, role, country, budget, skin_tone, undertone, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found.');
    }

    const user = users[0];
    const role = user.role || (user.email === 'admin@gmail.com' ? 'admin' : 'user');

    // Also fetch their latest skin analysis if available
    const [analyses]: any = await pool.query(
      'SELECT analysis_id, skin_tone, undertone, confidence_score, analyzed_at FROM skin_analysis WHERE user_id = ? ORDER BY analyzed_at DESC LIMIT 1',
      [userId]
    );

    return {
      ...user,
      role,
      skinTone: analyses[0]?.skin_tone || user.skin_tone || 'Medium',
      undertone: analyses[0]?.undertone || user.undertone || 'Warm',
      latestAnalysis: analyses[0] || null,
    };
  }

  static async updateUserProfile(userId: number, updates: {
    name?: string;
    country?: string;
    budget?: number;
  }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.country !== undefined) {
      fields.push('country = ?');
      values.push(updates.country);
    }
    if (updates.budget !== undefined) {
      fields.push('budget = ?');
      values.push(updates.budget);
    }

    if (fields.length === 0) {
      return this.getUserProfile(userId);
    }

    values.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, values);

    return this.getUserProfile(userId);
  }
}
