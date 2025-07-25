import { ZohoAuthManager } from '../../src/lib/auth/oauth-manager';
import { ZohoConfig } from '../../src/lib/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a mocked instance
const mockedAxiosInstance = {
  post: jest.fn()
};

mockedAxios.create.mockReturnValue(mockedAxiosInstance as any);

describe('ZohoAuthManager', () => {
  let authManager: ZohoAuthManager;
  let config: ZohoConfig;

  beforeEach(() => {
    config = {
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      redirectUri: 'http://localhost:3000/callback',
      refreshToken: 'test_refresh_token',
      dataCenter: 'com',
      scopes: ['ZohoCRM.modules.ALL', 'ZohoBooks.fullaccess.all']
    };
    
    authManager = new ZohoAuthManager(config);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      await authManager.refreshAccessToken();

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth/v2/token',
        expect.any(URLSearchParams)
      );
    });

    it('should handle refresh token errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: 'invalid_grant' }
        }
      };

      mockedAxiosInstance.post.mockRejectedValue(mockError);

      await expect(authManager.refreshAccessToken()).rejects.toThrow();
    });
  });

  describe('getValidAccessToken', () => {
    it('should return cached token if still valid', async () => {
      const mockResponse = {
        data: {
          access_token: 'valid_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      // First call should refresh
      const token1 = await authManager.getValidAccessToken();
      expect(token1).toBe('valid_token');

      // Second call should use cached token
      const token2 = await authManager.getValidAccessToken();
      expect(token2).toBe('valid_token');

      // Should only call axios once
      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should refresh token if expired', async () => {
      const mockResponse = {
        data: {
          access_token: 'refreshed_token',
          expires_in: 1, // Very short expiry
          token_type: 'Bearer'
        }
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      // First call
      const token1 = await authManager.getValidAccessToken();
      expect(token1).toBe('refreshed_token');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Mock new token response
      mockedAxiosInstance.post.mockResolvedValue({
        data: {
          access_token: 'new_refreshed_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      // Second call should refresh again
      const token2 = await authManager.getValidAccessToken();
      expect(token2).toBe('new_refreshed_token');

      // Should call axios twice
      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockResponse = {
        data: {
          scope: 'ZohoCRM.modules.ALL'
        }
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authManager.validateToken('valid_token');
      expect(result).toBe('ZohoCRM.modules.ALL');
    });

    it('should return false for invalid token', async () => {
      mockedAxiosInstance.post.mockRejectedValue(new Error('Invalid token'));

      const result = await authManager.validateToken('invalid_token');
      expect(result).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValue({ data: {} });

      await authManager.revokeToken('token_to_revoke');

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth/v2/token/revoke',
        expect.any(URLSearchParams)
      );
    });

    it('should handle revoke errors', async () => {
      mockedAxiosInstance.post.mockRejectedValue(new Error('Revoke failed'));

      await expect(authManager.revokeToken('token_to_revoke')).rejects.toThrow();
    });
  });
});