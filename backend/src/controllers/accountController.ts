import { Request, Response } from 'express';
import { hashPassword } from '../utils/auth';
import prisma from '../lib/prisma';

export const accountController = {
  // Get all accounts (HR only)
  getAllAccounts: async (req: Request, res: Response) => {
    try {
      const accounts = await prisma.users.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(accounts);
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  },

  // Get account by ID
  getAccountById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const account = await prisma.users.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      res.json(account);
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({ message: 'Failed to fetch account' });
    }
  },

  // Create new account
  createAccount: async (req: Request, res: Response) => {
    try {
      const { username, password, name, email, role, branchId } = req.body;

      // Validation
      if (!username || !password || !name || !email || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if username already exists
      const existingUsername = await prisma.users.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Check if email already exists
      const existingEmail = await prisma.users.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create account
      const newAccount = await prisma.users.create({
        data: {
          username,
          password: hashedPassword,
          name,
          email,
          role,
          branchId: branchId ? parseInt(branchId) : null,
          isActive: true
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json(newAccount);
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  },

  // Update account
  updateAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { username, name, email, role, branchId, isActive } = req.body;

      // Check if account exists
      const account = await prisma.users.findUnique({
        where: { id: parseInt(id) }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Check if new username is unique (if changed)
      if (username && username !== account.username) {
        const existingUsername = await prisma.users.findUnique({
          where: { username }
        });

        if (existingUsername) {
          return res.status(400).json({ message: 'Username already exists' });
        }
      }

      // Check if new email is unique (if changed)
      if (email && email !== account.email) {
        const existingEmail = await prisma.users.findUnique({
          where: { email }
        });

        if (existingEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      // Update account
      const updatedAccount = await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          ...(username && { username }),
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
          ...(branchId !== undefined && { branchId: branchId ? parseInt(branchId) : null }),
          ...(isActive !== undefined && { isActive })
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({ message: 'Failed to update account' });
    }
  },

  // Update password
  updatePassword: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      // Check if account exists
      const account = await prisma.users.findUnique({
        where: { id: parseInt(id) }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Update password
      await prisma.users.update({
        where: { id: parseInt(id) },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: 'Failed to update password' });
    }
  },

  // Delete account
  deleteAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if account exists
      const account = await prisma.users.findUnique({
        where: { id: parseInt(id) }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Prevent deleting current user
      if (req.user?.id === parseInt(id)) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Delete account
      await prisma.users.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  },

  // Toggle account status
  toggleAccountStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if account exists
      const account = await prisma.users.findUnique({
        where: { id: parseInt(id) }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Prevent disabling current user
      if (req.user?.id === parseInt(id) && account.isActive) {
        return res.status(400).json({ message: 'Cannot disable your own account' });
      }

      // Toggle status
      const updatedAccount = await prisma.users.update({
        where: { id: parseInt(id) },
        data: { isActive: !account.isActive },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error('Toggle account status error:', error);
      res.status(500).json({ message: 'Failed to toggle account status' });
    }
  }
};
