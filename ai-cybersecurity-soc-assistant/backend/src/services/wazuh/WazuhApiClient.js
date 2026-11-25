const axios = require('axios');
const https = require('https');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * WazuhApiClient - Central client for all Wazuh API communication.
 * Handles authentication, token caching, auto-refresh, and version isolation.
 */
class WazuhApiClient {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.connected = false;
    this.lastError = null;
    this.managerInfo = null;

    this.client = axios.create({
      baseURL: config.wazuh.apiUrl,
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.wazuh.verifySsl,
      }),
    });

    // Request interceptor - add token
    this.client.interceptors.request.use(
      async (reqConfig) => {
        // Skip auth for the auth endpoint itself
        if (reqConfig.url === '/security/user/authenticate') {
          return reqConfig;
        }
        const token = await this.getToken();
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest.url !== '/security/user/authenticate'
        ) {
          originalRequest._retry = true;
          this.token = null;
          this.tokenExpiry = null;
          try {
            const token = await this.authenticate();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (authError) {
            return Promise.reject(authError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Wazuh API and obtain JWT token
   */
  async authenticate() {
    try {
      if (!config.wazuh.username || !config.wazuh.password) {
        throw new Error('Wazuh credentials not configured');
      }

      const response = await this.client.post(
        '/security/user/authenticate',
        {},
        {
          auth: {
            username: config.wazuh.username,
            password: config.wazuh.password,
          },
        }
      );

      this.token = response.data.data.token;
      // Wazuh tokens typically expire in 900 seconds (15 min).
      // Refresh 60 seconds before expiry.
      this.tokenExpiry = Date.now() + (900 - 60) * 1000;
      this.connected = true;
      this.lastError = null;
      logger.info('Wazuh API authenticated successfully');
      return this.token;
    } catch (error) {
      this.connected = false;
      this.token = null;
      this.tokenExpiry = null;
      const msg = error.response
        ? `Wazuh auth failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        : `Wazuh auth failed: ${error.message}`;
      this.lastError = msg;
      logger.error(msg);
      throw error;
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }
    return this.authenticate();
  }

  /**
   * Make an authenticated GET request to the Wazuh API
   */
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      this.connected = true;
      this.lastError = null;
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'GET', endpoint);
      throw error;
    }
  }

  /**
   * Make an authenticated POST request to the Wazuh API
   */
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      this.connected = true;
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'POST', endpoint);
      throw error;
    }
  }

  /**
   * Make an authenticated PUT request to the Wazuh API
   */
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      this.connected = true;
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'PUT', endpoint);
      throw error;
    }
  }

  /**
   * Make an authenticated DELETE request to the Wazuh API
   */
  async delete(endpoint, params = {}) {
    try {
      const response = await this.client.delete(endpoint, { params });
      this.connected = true;
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'DELETE', endpoint);
      throw error;
    }
  }

  handleApiError(error, method, endpoint) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      this.connected = false;
      this.lastError = 'Wazuh server unreachable';
    } else if (error.response?.status === 401) {
      this.lastError = 'Authentication failed';
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED') {
      this.connected = false;
      this.lastError = 'SSL certificate error';
    } else {
      this.lastError = error.message;
    }
    logger.error(`Wazuh API ${method} ${endpoint} error: ${this.lastError}`);
  }

  /**
   * Get connection status information
   */
  getStatus() {
    return {
      connected: this.connected,
      lastError: this.lastError,
      apiUrl: config.wazuh.apiUrl,
      mode: config.wazuh.mode,
      hasCredentials: !!(config.wazuh.username && config.wazuh.password),
    };
  }

  /**
   * Test the connection without modifying state
   */
  async testConnection() {
    try {
      await this.authenticate();
      const info = await this.get('/');
      this.managerInfo = info.data;
      return {
        success: true,
        status: 'CONNECTED',
        version: info.data?.api_version,
        hostname: info.data?.hostname,
        manager: this.managerInfo,
      };
    } catch (error) {
      let status = 'SERVER_UNREACHABLE';
      if (error.response?.status === 401) status = 'AUTHENTICATION_FAILED';
      if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') status = 'SSL_ERROR';
      if (!config.wazuh.username) status = 'INVALID_CONFIGURATION';
      return {
        success: false,
        status,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const wazuhApiClient = new WazuhApiClient();

module.exports = wazuhApiClient;
