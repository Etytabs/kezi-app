import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';
import { AuthRequest, generateToken, authMiddleware, logAudit } from '../middleware/auth';
import { sendVerificationEmail } from '../services/emailService';

const router = Router();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, password, language = 'en' } = req.body;
    
    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }
    
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const result = await query(
      `INSERT INTO users (email, name, password_hash, role, language, email_verified, verification_code, verification_expires_at, verification_attempts)
       VALUES ($1, $2, $3, 'USER', $4, false, $5, $6, 0)
       RETURNING id, email, name, role, language, created_at, email_verified`,
      [email.toLowerCase(), name, passwordHash, language, verificationCodeHash, verificationExpiresAt]
    );
    
    const user = result.rows[0];
    
    await query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [user.id]
    );
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    await logAudit(user.id, 'USER_REGISTER', 'users', user.id, null, { email: user.email, name: user.name }, req.ip, req.get('user-agent'));
    
    const emailResult = await sendVerificationEmail(user.email, verificationCode, user.name, language);
    if (!emailResult.success) {
      console.warn('Failed to send verification email:', emailResult.error);
    }
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        emailVerified: user.email_verified
      },
      token,
      verificationCode: process.env.NODE_ENV !== 'production' ? verificationCode : undefined,
      verificationExpiresAt: verificationExpiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await query(
      `SELECT id, email, name, password_hash, role, language, is_active, email_verified
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    await logAudit(user.id, 'USER_LOGIN', 'users', user.id, null, null, req.ip, req.get('user-agent'));
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        emailVerified: user.email_verified
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    
    if (!code || code.length !== 6) {
      res.status(400).json({ error: 'Valid 6-digit code is required' });
      return;
    }
    
    const userResult = await query(
      `SELECT id, email, email_verified, verification_code, verification_expires_at, verification_attempts
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      res.json({ message: 'Email already verified', verified: true });
      return;
    }
    
    if (user.verification_attempts >= 5) {
      res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
      return;
    }
    
    if (!user.verification_code || !user.verification_expires_at) {
      res.status(400).json({ error: 'No verification code found. Please request a new code.' });
      return;
    }
    
    if (new Date() > new Date(user.verification_expires_at)) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }
    
    const validCode = await bcrypt.compare(code, user.verification_code);
    if (!validCode) {
      await query(
        `UPDATE users SET verification_attempts = verification_attempts + 1 WHERE id = $1`,
        [user.id]
      );
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }
    
    await query(
      `UPDATE users SET email_verified = true, verification_code = NULL, verification_expires_at = NULL, verification_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );
    
    await logAudit(user.id, 'EMAIL_VERIFIED', 'users', user.id, null, null, req.ip, req.get('user-agent'));
    
    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/resend-code', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userResult = await query(
      `SELECT id, email, email_verified, verification_expires_at
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      res.json({ message: 'Email already verified' });
      return;
    }
    
    if (user.verification_expires_at) {
      const lastCodeTime = new Date(user.verification_expires_at).getTime() - (15 * 60 * 1000);
      const timeSinceLastCode = Date.now() - lastCodeTime;
      if (timeSinceLastCode < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastCode) / 1000);
        res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting a new code` });
        return;
      }
    }
    
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await query(
      `UPDATE users SET verification_code = $1, verification_expires_at = $2, verification_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [verificationCodeHash, verificationExpiresAt, user.id]
    );
    
    const nameResult = await query('SELECT name, language FROM users WHERE id = $1', [user.id]);
    const userName = nameResult.rows[0]?.name || 'User';
    const userLanguage = nameResult.rows[0]?.language || 'en';
    
    const emailResult = await sendVerificationEmail(user.email, verificationCode, userName, userLanguage);
    if (!emailResult.success) {
      console.warn('Failed to send verification email:', emailResult.error);
    }
    
    await logAudit(user.id, 'RESEND_VERIFICATION', 'users', user.id, null, null, req.ip, req.get('user-agent'));
    
    res.json({
      message: 'Verification code sent',
      verificationCode: process.env.NODE_ENV !== 'production' ? verificationCode : undefined,
      verificationExpiresAt: verificationExpiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.avatar_url, u.language, u.created_at, u.email_verified,
              p.last_period_date, p.cycle_length, p.period_length, p.notifications_enabled,
              p.latitude, p.longitude, p.address_line1, p.city, p.district
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const user = result.rows[0];
    
    let merchantData = null;
    if (user.role === 'MERCHANT') {
      const merchantResult = await query(
        `SELECT id, business_name, status, rating, total_reviews
         FROM merchants WHERE user_id = $1`,
        [user.id]
      );
      if (merchantResult.rows.length > 0) {
        merchantData = merchantResult.rows[0];
      }
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        language: user.language,
        createdAt: user.created_at,
        emailVerified: user.email_verified,
        profile: {
          lastPeriodDate: user.last_period_date,
          cycleLength: user.cycle_length,
          periodLength: user.period_length,
          notificationsEnabled: user.notifications_enabled,
          latitude: user.latitude,
          longitude: user.longitude,
          addressLine1: user.address_line1,
          city: user.city,
          district: user.district
        },
        merchant: merchantData
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, language, cycleConfig, address } = req.body;
    
    if (name || phone || language) {
      await query(
        `UPDATE users SET 
          name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          language = COALESCE($3, language),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [name, phone, language, req.user!.userId]
      );
    }
    
    if (cycleConfig) {
      await query(
        `UPDATE user_profiles SET
          last_period_date = COALESCE($1, last_period_date),
          cycle_length = COALESCE($2, cycle_length),
          period_length = COALESCE($3, period_length),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [cycleConfig.lastPeriodDate, cycleConfig.cycleLength, cycleConfig.periodLength, req.user!.userId]
      );
    }
    
    if (address) {
      await query(
        `UPDATE user_profiles SET
          address_line1 = COALESCE($1, address_line1),
          city = COALESCE($2, city),
          district = COALESCE($3, district),
          latitude = COALESCE($4, latitude),
          longitude = COALESCE($5, longitude),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6`,
        [address.addressLine1, address.city, address.district, address.latitude, address.longitude, req.user!.userId]
      );
    }
    
    await logAudit(req.user!.userId, 'PROFILE_UPDATE', 'users', req.user!.userId, null, req.body, req.ip, req.get('user-agent'));
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await logAudit(req.user!.userId, 'ACCOUNT_DELETE', 'users', req.user!.userId, null, null, req.ip, req.get('user-agent'));
    
    await query(
      `UPDATE users SET is_active = false, email = email || '_deleted_' || id, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.user!.userId]
    );
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
