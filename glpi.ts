//   _____ _      _____ _____    _____                            _             
//  / ____| |    |  __ \_   _|  / ____|                          | |            
// | |  __| |    | |__) || |   | |     ___  _ __  _ __   ___  ___| |_ ___  _ __ 
// | | |_ | |    |  ___/ | |   | |    / _ \| '_ \| '_ \ / _ \/ __| __/ _ \| '__|
// | |__| | |____| |    _| |_  | |___| (_) | | | | | | |  __/ (__| || (_) | |   
//  \_____|______|_|   |_____|  \_____\___/|_| |_|_| |_|\___|\___|\__\___/|_|   
                                                                              
                                                                              
// Le script permet de faire le connecteur GLPI et mettre cela en CSV
// Le CSV est universel est peut être utilisé par toute application
// Exemple: Zabbix


import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as net from 'net';
import * as childProcess from 'child_process';
import * as dns from 'dns';

// Désactiver la vérification SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Variables d'environnement
const apiUrl = process.env.API_URL || '';
const userToken = process.env.USER_TOKEN || '';
const appToken = process.env.APP_TOKEN || '';
const csvFilePath = process.env.CSV_FILE_PATH || 'machines_export.csv';

const searchCriteria = process.env.SEARCH_CRITERIA || '';
const Domain = process.env.LOCAL_DOMAIN || '';
const serverName = process.env.SERVER_NAME || '';

const windowsPorts = (process.env.WINDOWS_PORTS || '').split(',').map(Number);
const linuxPorts = (process.env.LINUX_PORTS || '').split(',').map(Number);

// En-têtes de base pour les requêtes
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `user_token ${userToken}`,
    'App-Token': appToken
};

// Fonction pour obtenir un nouveau session_token
async function getNewSessionToken(): Promise<string | null> {
    try {
        const response = await axios.get(`${apiUrl}/initSession`, { headers });
        return response.data.session_token;
    } catch (error) {
        console.error('Erreur lors de l\'obtention du session_token:', error);
        return null;
    }
}

// Fonction pour récupérer les machines depuis l'API GLPI
async function getMachines(sessionToken: string) {
    const machineHeaders = { ...headers, 'Session-Token': sessionToken };
    const searchUrl = `${apiUrl}/search/Computer?${searchCriteria}&forcedisplay[0]=2&forcedisplay[1]=1&forcedisplay[2]=12&forcedisplay[3]=15&sort=15&order=ASC`;

    try {
        const response = await axios.get(searchUrl, { headers: machineHeaders });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des machines:', error);
        return null;
    }
}

async function getIPFromDNS(hostname: string): Promise<string> {
    try {
        const result = await dns.promises.lookup(`${hostname}.${localDomain}`);
        return result.address;
    } catch (error) {
        console.error(`Erreur lors de la résolution DNS pour ${hostname}:`, error);
        return 'IP not found';
    }
}

async function isPortOpen(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, ip);
    });
}

// Fonction pour déterminer le type de système d'exploitation en fonction des ports
async function detectOS(ip: string): Promise<string> {
    for (const port of windowsPorts) {
        if (await isPortOpen(ip, port)) return 'Windows';
    }
    for (const port of linuxPorts) {
        if (await isPortOpen(ip, port)) return 'Linux';
    }
    return 'Unknown';
}

// Fonction pour sauvegarder les données dans le fichier CSV
function saveData(data: any[]) {
    const header = 'hostname,ip,os\n';
    const rows = data.map(machine => `${machine.hostname},${machine.ip},${machine.os}`).join('\n');
    fs.writeFileSync(csvFilePath, header + rows);
    console.log('Données sauvegardées dans', csvFilePath);
}

// Fonction principale pour exécuter le script
(async function main() {
    // Obtenir un nouveau Session-Token
    const sessionToken = await getNewSessionToken();
    if (!sessionToken) {
        console.error('Impossible d\'obtenir un Session-Token. Script terminé.');
        return;
    }

    // Récupérer les machines
    const machinesData = await getMachines(sessionToken);
    if (!machinesData) {
        console.error('Impossible de récupérer les données des machines. Script terminé.');
        return;
    }

    // Tableau pour stocker les informations des machines
    const machines = [];

    for (const machine of machinesData.data) {
        const hostname = machine['1']; // Nom de la machine
        const ip = await getIPFromDNS(hostname); // Utilisation de la nouvelle fonction asynchrone
        const osType = ip !== 'IP not found' ? await detectOS(ip) : 'IP not found';
        machines.push({ hostname, ip, os: osType });
    }

    // Sauvegarder les données dans le fichier CSV
    saveData(machines);

    console.log('Good Bye :)');
})();
