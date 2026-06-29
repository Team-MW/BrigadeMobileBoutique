/**
 * Eboutik (Hiboutik) REST API Client
 * 
 * Ce module prépare et configure la connexion avec l'API v2 d'Eboutik/Hiboutik.
 * L'authentification utilise le protocole Basic Auth avec l'email utilisateur et la clé API.
 * 
 * Les identifiants sont chargés à partir des variables d'environnement Vite :
 * - VITE_EBOUTIK_ACCOUNT
 * - VITE_EBOUTIK_API_USER
 * - VITE_EBOUTIK_API_KEY
 * - VITE_EBOUTIK_WEBHOOK_SECRET
 */

class EboutikClient {
  constructor(config = {}) {
    // Si aucun paramètre n'est passé, on récupère les variables d'environnement Vite.
    // import.meta.env peut être absent ou partiel dans des environnements de test purs (Node.js).
    const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

    this.account = config.account || env.VITE_EBOUTIK_ACCOUNT || '';
    this.apiUser = config.apiUser || env.VITE_EBOUTIK_API_USER || '';
    this.apiKey = config.apiKey || env.VITE_EBOUTIK_API_KEY || '';
    this.webhookSecret = config.webhookSecret || env.VITE_EBOUTIK_WEBHOOK_SECRET || '';

    this.baseUrl = this.account ? `https://${this.account}.hiboutik.com/api` : '';
  }

  /**
   * Génère le header Authorization pour Basic Auth.
   * Compatible navigateur (btoa) et Node.js (Buffer).
   */
  getAuthHeader() {
    const creds = `${this.apiUser}:${this.apiKey}`;
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `Basic ${window.btoa(creds)}`;
    }
    // Fallback Node.js pour les scripts de test ou d'arrière-plan
    return `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  /**
   * Effectue une requête HTTP générique vers l'API Hiboutik
   * 
   * @param {string} method - GET, POST, PUT, DELETE
   * @param {string} resource - Le chemin de la ressource (ex: 'products', 'sales')
   * @param {object|null} paramsOrData - Paramètres d'URL (GET/DELETE) ou corps de requête (POST/PUT)
   * @param {object} options - Options supplémentaires (headers, contentType)
   */
  async request(method, resource, paramsOrData = null, options = {}) {
    if (!this.account || !this.apiUser || !this.apiKey) {
      return {
        success: false,
        error: "Le client Eboutik n'est pas entièrement configuré. Identifiants manquants (compte, utilisateur ou clé API)."
      };
    }

    const cleanResource = resource.startsWith('/') ? resource : `/${resource}`;
    let url = `${this.baseUrl}${cleanResource}`;
    
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
      ...options.headers
    };

    const fetchOptions = {
      method: method.toUpperCase(),
      headers,
    };

    if (fetchOptions.method === 'GET' || fetchOptions.method === 'DELETE') {
      if (paramsOrData) {
        // Enlève les valeurs null ou undefined
        const cleanParams = Object.fromEntries(
          Object.entries(paramsOrData).filter(([_, v]) => v != null)
        );
        const queryParams = new URLSearchParams(cleanParams).toString();
        if (queryParams) {
          url = `${url}?${queryParams}`;
        }
      }
    } else {
      // POST ou PUT
      if (paramsOrData) {
        if (options.contentType === 'application/x-www-form-urlencoded') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          fetchOptions.body = new URLSearchParams(paramsOrData).toString();
        } else {
          headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(paramsOrData);
        }
      }
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      let responseData = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: responseData || 'Erreur inconnue lors de la requête API',
        };
      }

      return {
        success: true,
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erreur réseau lors de la communication avec l'API Eboutik",
      };
    }
  }

  // ==========================================
  // Méthodes d'abstraction (Produits)
  // ==========================================

  /**
   * Récupère la liste des produits actifs
   * @param {object} params - Filtres de recherche (ex: {limit: 50, page: 1})
   */
  async getProducts(params = {}) {
    return this.request('GET', 'products', params);
  }

  /**
   * Récupère un produit spécifique par son ID
   * @param {number|string} productId 
   */
  async getProduct(productId) {
    return this.request('GET', `products/${productId}`);
  }

  /**
   * Crée un nouveau produit
   * @param {object} productData 
   */
  async createProduct(productData) {
    return this.request('POST', 'products', productData);
  }

  /**
   * Met à jour un produit existant
   * @param {number|string} productId 
   * @param {object} productData 
   */
  async updateProduct(productId, productData) {
    return this.request('PUT', `products/${productId}`, productData);
  }

  // ==========================================
  // Méthodes d'abstraction (Ventes)
  // ==========================================

  /**
   * Récupère la liste des ventes
   * @param {object} params - Filtres de recherche
   */
  async getSales(params = {}) {
    return this.request('GET', 'sales', params);
  }

  /**
   * Crée une vente (ticket de caisse ou brouillon)
   * @param {object} saleData 
   */
  async createSale(saleData) {
    return this.request('POST', 'sales', saleData);
  }

  // ==========================================
  // Méthodes d'abstraction (Stocks)
  // ==========================================

  /**
   * Récupère l'état général des stocks
   * @param {object} params - Filtres de recherche (ex: {warehouse_id: 1})
   */
  async getStock(params = {}) {
    return this.request('GET', 'stock', params);
  }

  // ==========================================
  // Méthodes d'abstraction (Clients)
  // ==========================================

  /**
   * Récupère la liste des clients
   * @param {object} params - Filtres de recherche
   */
  async getCustomers(params = {}) {
    return this.request('GET', 'customers', params);
  }

  /**
   * Crée une fiche client
   * @param {object} customerData 
   */
  async createCustomer(customerData) {
    return this.request('POST', 'customers', customerData);
  }

  // ==========================================
  // Utilitaires de Webhooks
  // ==========================================

  /**
   * Valide un webhook reçu par comparaison avec la clé secrète configurée.
   * Les webhooks Hiboutik peuvent être configurés pour envoyer un token secret.
   * 
   * @param {string} token reçu dans la requête
   * @returns {boolean} true si le token correspond
   */
  verifyWebhook(token) {
    if (!this.webhookSecret) return false;
    return this.webhookSecret === token;
  }
}

export const eboutik = new EboutikClient();
export default EboutikClient;
