// © 2025 Quartermasters FZC. All rights reserved.

import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { type User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_32_chars_minimum_length';
const OTP_EXPIRY_MINUTES = 5;

export interface JwtPayload {
  userId: string;
  role: 'passenger' | 'driver' | 'admin';
  iat: number;
  exp: number;
}

export interface GoogleLoginData {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export class AuthService {
  generateOtp(): string {
    // In production, use a proper OTP generator
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(identifier: string): Promise<void> {
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await storage.createOtpCode({
      identifier,
      code,
      expiresAt,
      verified: false,
    });

    // In production, send actual OTP via SMS/Email
    console.log(`OTP for ${identifier}: ${code}`);
  }

  async verifyOtp(identifier: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const otpRecord = await storage.getValidOtpCode(identifier, code);
    if (!otpRecord) {
      throw new Error('Invalid or expired OTP code');
    }

    await storage.markOtpCodeAsVerified(otpRecord.id);

    // Find or create user
    let user = await storage.getUserByPhone(identifier) || await storage.getUserByEmail(identifier);
    
    if (!user) {
      // Create new user
      const isEmail = identifier.includes('@');
      user = await storage.createUser({
        name: isEmail ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`,
        phone: isEmail ? '' : identifier,
        email: isEmail ? identifier : undefined,
        role: 'passenger',
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await storage.getUser(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async loginWithGoogle(data: GoogleLoginData): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // Check if user exists by Google ID or email
    let user = await storage.getUserByGoogleId(data.googleId);
    
    if (!user && data.email) {
      user = await storage.getUserByEmail(data.email);
      
      // If user exists with email but no Google ID, link the accounts
      if (user) {
        user = await storage.updateUser(user.id, {
          googleId: data.googleId,
          picture: data.picture,
        });
      }
    }
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        name: data.name,
        email: data.email,
        phone: '',
        googleId: data.googleId,
        picture: data.picture,
        role: 'passenger',
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  }
}

export const authService = new AuthService();
