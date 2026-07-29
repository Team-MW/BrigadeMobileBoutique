import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const data = `
IP8	50	70	30	80	55	95	40
IP8 Plus	60	75	40	90	55	95	45
IPX	70	80	90	40	90	130	55	40
IPXR	70	80	95	40	90	130	55	40
IPXS	65	75	90	35	85	125	50	35
IPXS MAX	70	90	110	40	90	130	55	40
IP11	70	100	120	40	90	130	55	45
IP11 Pro	80	110	125	50	100	140	70	55
IP11 ProMax	80	115	130	60	110	150	70	60
IPSE 2	60	70	80	50	90	130	55	45
IP12 mini	80	130	150	50	110	150	75	40
IP12	80	120	160	50	110	150	60	40
IP12 Pro	80	120	160	50	110	150	80	40
IP12 ProMax	90	120	220	60	120	160	95	50
IP13 mini	80	130	170	50	130	170	55	50
IP13	80	120	220	50	110	150	55	50
IP13 Pro	90	140	250	50	110	150	100	50
IP13 ProMax	120	150	290	60	120	160	100	50
IPSE 3	60	70	80	40	90	130	55	45
IP14	90	120	230	60	90	130	75	45
IP14 Plus	100	140	260	60	100	140	80	45
IP14 Pro	120	150	280	70	140	180	95	55
IP14 ProMax	140	170	310	70	150	190	90	45
IP15	100	150	300	60	90	130	65	50
IP15 Plus	120	160	330	60	100	140	70	50
IP15 Pro	130	170	350	70	100	140	70	50
IP15 ProMax	140	190	390	70	120	160	90	50
IP16	130	160	350	70	90	130	85	55
IP16 Plus	150	170	380	70	100	140	70	50
IP16 Pro	170	200	390	80	100	140	85	55
IP16 ProMax	200	230	450	90	120	160	90	65
`.trim();

const ALL_MODELS = [
  "IP17PM", "IP17P", "IP17",
  "IP16PM", "IP16P", "IP16+", "IP16",
  "IP15PM", "IP15P", "IP15+", "IP15",
  "IP14PM", "IP14P", "IP14+", "IP14",
  "IP13PM", "IP13P", "IP13", "IP13 mini",
  "IP12PM", "IP12P", "IP12", "IP12 mini",
  "IP11PM", "IP11P", "IP11",
  "IPXS Max", "IPXS", "IPXR", "IPX",
  "IP8+", "IP8", "IP7+", "IP7", "IPSE"
];

// Mapping from image model names to database model names
const modelMap = {
  "IP8": "IP8",
  "IP8 Plus": "IP8+",
  "IPX": "IPX",
  "IPXR": "IPXR",
  "IPXS": "IPXS",
  "IPXS MAX": "IPXS Max",
  "IP11": "IP11",
  "IP11 Pro": "IP11P",
  "IP11 ProMax": "IP11PM",
  "IPSE 2": "IPSE", // we will overwrite IPSE with IPSE 3 later, but maybe we should map both? The app only has "IPSE". I'll use the IPSE 3 values for IPSE since it's the latest.
  "IP12 mini": "IP12 mini",
  "IP12": "IP12",
  "IP12 Pro": "IP12P",
  "IP12 ProMax": "IP12PM",
  "IP13 mini": "IP13 mini",
  "IP13": "IP13",
  "IP13 Pro": "IP13P",
  "IP13 ProMax": "IP13PM",
  "IPSE 3": "IPSE",
  "IP14": "IP14",
  "IP14 Plus": "IP14+",
  "IP14 Pro": "IP14P",
  "IP14 ProMax": "IP14PM",
  "IP15": "IP15",
  "IP15 Plus": "IP15+",
  "IP15 Pro": "IP15P",
  "IP15 ProMax": "IP15PM",
  "IP16": "IP16",
  "IP16 Plus": "IP16+",
  "IP16 Pro": "IP16P",
  "IP16 ProMax": "IP16PM"
};

async function run() {
  const lines = data.split('\n');
  const updates = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    const rawModel = parts[0];
    const model = modelMap[rawModel];
    if (!model) continue;

    const nums = parts.slice(1).map(Number);
    let values = {};

    if (rawModel === "IP8" || rawModel === "IP8 Plus") {
        // The user specifically warned about OLED for IP8/8+.
        // The image has 7 columns filled. The most logical mapping based on prices and the warning is:
        // No OLED.
        values = {
            "LCD": nums[0],
            "ORIGINAL": nums[1],
            "Batterie": nums[2],
            "Vitre Arrière": nums[3], // or maybe swapped with chassis? I will just map them sequentially 
            "Châssis": nums[4],
            "Caméra Arrière": nums[5],
            "Connecteur Charge": nums[6]
        };
    } else {
        values = {
            "LCD": nums[0],
            "OLED": nums[1],
            "ORIGINAL": nums[2],
            "Batterie": nums[3],
            "Vitre Arrière": nums[4],
            "Châssis": nums[5],
            "Caméra Arrière": nums[6],
            "Connecteur Charge": nums[7]
        };
    }
    
    for (const [repair, price] of Object.entries(values)) {
      if (price) {
        updates.push({
          model,
          repair,
          price
        });
      }
    }
  }

  console.log(`Prepared ${updates.length} updates. Sending to Supabase...`);
  
  for (const update of updates) {
    const { error } = await supabase
      .from('grille_tarifaire')
      .upsert(update, { onConflict: 'model,repair' });
      
    if (error) {
      console.error(`Error updating ${update.model} - ${update.repair}:`, error);
    }
  }
  
  console.log('Done!');
}

run();
