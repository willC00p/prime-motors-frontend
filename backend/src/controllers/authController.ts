import { Request, Response } from 'express';
import { generateToken, comparePassword } from '../utils/auth';
import type { LoginCredentials, UserRole } from '../types/auth';
import prisma from '../lib/prisma';

function isValidUserRole(role: string): role is UserRole {
  return ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit', 'branch'].includes(role);
}

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { username, password }: LoginCredentials = req.body;

      const user = await prisma.users.findUnique({
        where: { username }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Validate user role
      if (!isValidUserRole(user.role)) {
        return res.status(500).json({ message: 'Invalid user role in database' });
      }

      // Create token payload without sensitive data
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        role: user.role as UserRole, // Now safe to cast after validation
        branchId: user.branchId,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const token = generateToken(userWithoutPassword);

      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  logout: async (_req: Request, res: Response) => {
    // Since we're using JWT, we don't need to do anything server-side
    // The client will remove the token
    res.json({ message: 'Logged out successfully' });
  },

  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      // Validate user role
      if (!isValidUserRole(user.role)) {
        return res.status(500).json({ message: 'Invalid user role in database' });
      }

      // Remove password and cast role
      const { password: _, ...rest } = user;
      const userWithoutPassword = {
        ...rest,
        role: user.role as UserRole // Safe to cast after validation
      };
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
