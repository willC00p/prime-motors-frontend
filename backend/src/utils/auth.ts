import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import type { User } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

export const generateToken = (user: Omit<User, 'password'>) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader); // Debug log

  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token); // Debug log

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as User;
    console.log('Verified user:', user); // Debug log
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err); // Debug log
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
