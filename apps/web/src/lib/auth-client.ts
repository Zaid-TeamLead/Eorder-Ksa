import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

export interface Session {
  user: User;
  accessToken: string;
}

class AuthClient {
  private accessToken: string | null = null;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<Session> {
    const response = await fetch(`${API_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Sign in failed");
    }

    const data: AuthResponse = await response.json();
    this.accessToken = data.data.accessToken;

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", this.accessToken);
    }

    return {
      user: data.data.user,
      accessToken: this.accessToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include", // Important for cookies
        });

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await response.json();
        this.accessToken = data.data.accessToken;

        if (!this.accessToken) {
          throw new Error("No access token received");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", this.accessToken);
        }

        return this.accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    if (!this.accessToken) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
      } catch {
        return null;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          try {
            const newToken = await this.refreshAccessToken();
            if (!newToken) {
              return null;
            }
            // Retry the request
            const retryResponse = await fetch(`${API_URL}/api/auth/me`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
              credentials: "include",
            });

            if (!retryResponse.ok) {
              return null;
            }

            const retryData = await retryResponse.json();
            return {
              user: retryData.data.user,
              accessToken: newToken,
            };
          } catch {
            return null;
          }
        }
        return null;
      }

      const data = await response.json();
      if (!this.accessToken) {
        return null;
      }
      return {
        user: data.data.user,
        accessToken: this.accessToken,
      };
    } catch {
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      this.accessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
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

    authClient
      .getSession()
      .then((sess) => {
        if (mounted) {
          setSession(sess);
          setIsPending(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setIsPending(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data: session, isPending };
}
