import axios, { AxiosInstance } from 'axios';
import { ZohoTokenResponse, ZohoConfig, AuthenticationError } from '../types';

export class ZohoAuthManager {
  private axiosInstance: AxiosInstance;
  private config: ZohoConfig;
  private currentToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ZohoConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `https://accounts.zoho.${config.dataCenter}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.zoho.${this.config.dataCenter}/oauth/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ZohoTokenResponse> {
    try {
      const response = await this.axiosInstance.post('/oauth/v2/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code: code
        })
      );

      return response.data;
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to exchange code for tokens: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<ZohoTokenResponse> {
    const tokenToUse = refreshToken || this.config.refreshToken;
    
    if (!tokenToUse) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      const response = await this.axiosInstance.post('/oauth/v2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: tokenToUse
        })
      );

      const tokenData = response.data;
      this.currentToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return tokenData;
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to refresh access token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string> {
    if (this.currentToken && Date.now() < this.tokenExpiry - 60000) {
      return this.currentToken;
    }

    const tokenData = await this.refreshAccessToken();
    return tokenData.access_token;
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.axiosInstance.post('/oauth/v2/token/revoke',
        new URLSearchParams({
          token: token
        })
      );
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to revoke token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Check if token is valid
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/oauth/v2/token/info',
        new URLSearchParams({
          token: token
        })
      );
      
      return response.data && response.data.scope;
    } catch (error) {
      return false;
    }
  }
}
