import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EboutikClient from '../src/lib/eboutik.js';

// Obtenir le chemin du dossier courant dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction simple pour parser le fichier .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.warn("Fichier .env introuvable au chemin :", envPath);
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index !== -1) {
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  return env;
}

async function runTest() {
  console.log("=== TEST DE PRÉPARATION DE L'API EBOUTIK ===\n");

  const env = loadEnv();
  
  // Initialisation du client avec les variables du fichier .env
  const config = {
    account: env.VITE_EBOUTIK_ACCOUNT,
    apiUser: env.VITE_EBOUTIK_API_USER,
    apiKey: env.VITE_EBOUTIK_API_KEY,
    webhookSecret: env.VITE_EBOUTIK_WEBHOOK_SECRET,
  };

  console.log("Identifiants chargés depuis .env :");
  console.log("- Compte :", config.account || "[MANQUANT]");
  console.log("- Utilisateur (Email) :", config.apiUser || "[MANQUANT]");
  console.log("- Clé API :", config.apiKey ? `${config.apiKey.slice(0, 5)}... (longueur: ${config.apiKey.length})` : "[MANQUANT]");
  console.log("- Secret Webhook :", config.webhookSecret ? `${config.webhookSecret.slice(0, 5)}...` : "[MANQUANT]");
  console.log("");

  if (!config.account || !config.apiUser || !config.apiKey) {
    console.error("Erreur : Identifiants incomplets dans le fichier .env. Veuillez vérifier les clés.");
    process.exit(1);
  }

  // Instanciation du client
  const client = new EboutikClient(config);

  console.log("Configuration du client :");
  console.log("- URL de base :", client.baseUrl);
  
  const authHeader = client.getAuthHeader();
  console.log("- Header Authorization généré :", authHeader.slice(0, 20) + "...");
  console.log("");

  // Simulation d'une requête
  console.log("Simulation d'une requête GET /products :");
  const testUrl = `${client.baseUrl}/products`;
  console.log("- URL ciblée :", testUrl);
  console.log("- Headers envoyés :");
  console.log("  * Authorization :", authHeader.slice(0, 15) + "[ENCODÉ_BASE64]...");
  console.log("  * Accept : application/json");
  console.log("");

  // Vérifier si l'utilisateur a demandé une vraie connexion
  const args = process.argv.slice(2);
  if (args.includes('--run')) {
    console.log(">> Tentative de connexion réelle à l'API (flag --run détecté)...");
    
    if (typeof globalThis.fetch === 'undefined') {
      console.error("Erreur : fetch n'est pas défini globalement dans cette version de Node.js.");
      console.log("Veuillez utiliser Node.js v18 ou plus récent.");
      process.exit(1);
    }

    console.log("Envoi de la requête aux serveurs Eboutik (Hiboutik)...");
    const result = await client.getProducts({ limit: 1 });
    
    if (result.success) {
      console.log("\n[SUCCÈS] Connexion établie avec l'API !");
      console.log("Statut HTTP :", result.status);
      console.log("Données reçues (1er produit ou liste) :");
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log("\n[ÉCHEC] La connexion a échoué.");
      console.log("Erreur :", result.error);
      if (result.status) {
        console.log("Code HTTP :", result.status, result.statusText);
      }
    }
  } else {
    console.log("Note : Aucune connexion n'a été tentée. C'est une simple préparation.");
    console.log("Pour tester une connexion réelle, lancez : node scratch/test_eboutik.js --run");
  }
  
  console.log("\n=== FIN DU TEST ===");
}

runTest().catch(err => {
  console.error("Une erreur est survenue lors de l'exécution du test :", err);
});
