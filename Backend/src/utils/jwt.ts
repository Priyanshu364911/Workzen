import jwt from 'jsonwebtoken';
import config from '../config/environment';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class JwtUtils {
  /**
   * Generate JWT token
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}

export default JwtUtils;