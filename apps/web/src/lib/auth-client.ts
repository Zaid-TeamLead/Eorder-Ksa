import { useEffect, useState } from "react";
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export interface User {
  id?: string;
  userId?: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  SlpCode: string;
  pdiLoTp?: string;
}

export interface Session {
  user: User;
}

class AuthClient {
  private sessionListeners: Set<() => void> = new Set();
  private currentSession: Session | null = null;

  /**
   * Subscribe to session changes
   */
  onSessionChange(callback: () => void): () => void {
    this.sessionListeners.add(callback);
    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of session changes
   */
  private notifySessionChange(): void {
    this.sessionListeners.forEach((callback) => callback());
  }

  /**
   * Generate OTP for user
   */
  async generateOtp(userId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/generate-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate OTP");
    }
  }

  /**
   * Verify OTP and sign in
   */
  async verifyOtp(userId: string, otp: string): Promise<Session> {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userId, otp }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to verify OTP");
    }

    const data = await response.json();

    // Store session in memory
    this.currentSession = {
      user: {
        ...data.data.user,
        pdiLoTp: data.data.user?.pdiLoTp || otp,
      },
    };

    // Store in localStorage for persistence across page reloads
    if (typeof window !== "undefined") {
      localStorage.setItem("userSession", JSON.stringify(this.currentSession));
    }

    this.notifySessionChange();

    return this.currentSession;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    // Return cached session if available
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to load from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("userSession");
        if (stored) {
          this.currentSession = JSON.parse(stored) as Session;
          return this.currentSession;
        }
      } catch {
        // Ignore parse errors
      }
    }

    return null;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      logger.error("Error signing out:", error);
    } finally {
      // Clear session
      this.currentSession = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("userSession");
      }
      this.notifySessionChange();
    }
  }
}

// Singleton instance
export const authClient = new AuthClient();

/**
 * React hook to get current session
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let mounted = true;

    const updateSession = async () => {
      try {
        const sess = await authClient.getSession();
        if (mounted) {
          setSession(sess);
          setIsPending(false);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setIsPending(false);
        }
      }
    };

    updateSession();

    const unsubscribe = authClient.onSessionChange(() => {
      updateSession();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { data: session, isPending };
}
