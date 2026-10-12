import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, country, budget, skinTone, undertone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required fields.',
        });
      }

      const result = await AuthService.registerUser({
        name,
        email,
        password,
        country,
        budget: budget ? Number(budget) : 3000,
        skinTone,
        undertone,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Registration failed.',
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required.',
        });
      }

      const result = await AuthService.loginUser({ email, password });
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: err.message || 'Authentication failed.',
      });
    }
  }
}
