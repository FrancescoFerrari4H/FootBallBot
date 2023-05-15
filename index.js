const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = "6184044128:AAHG0y2TKyijd7iOFC9Cnq0dcHWpWS8DQcI";
const request = require('request');
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const axios = require('axios');
const fs = require('fs');
const ejs = require('ejs');
const express = require('express');
const fetch = require('isomorphic-fetch');
const bodyParser = require('body-parser');
const app = express();
// const photo = fs.readFileSync('futbol.png');
// bot.setMyProfilePhoto(photo);

//ejs
app.set('view engine', 'ejs');

// Set up the web interface routes
app.use(bodyParser.urlencoded({ extended: false }));
    app.get('/', (req, res) => {
    ejs.renderFile(__dirname + '/views/index.ejs', {}, (err, html) => {
        if (err) {
        console.log(err);
        res.status(500).send('Error rendering page');
        } else {
        res.send(html);
        }
    });
    });


    // Definisci la route per la pagina di ricerca del giocatore
    app.get('/cercagiocatore', async (req, res) => {
        const playerName = req.query.playerName;
        const leagueName = req.query.leagueName;
    
        // Cerca l'identificatore numerico della lega utilizzando la funzione GetIdLega()
        const leagueId = await GetIdLega(leagueName);
    
        // Effettua la ricerca del giocatore utilizzando l'API di RapidAPI
        const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/players?league=${leagueId}&search=${encodeURIComponent(playerName)}`, {
            headers: {
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
                'x-rapidapi-key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63'
            }
        });
    
        // Converte il risultato in un oggetto JavaScript
        const data = await response.json();
    
        // Riformatta il risultato in un formato personalizzato
        const results = data.response.map((item) => {
            return {
                playerName: `${item.player.firstname} ${item.player.lastname}`,
                teamName: item.statistics[0].team.name,
                leagueName: item.statistics[0].league.name,
                goals: item.statistics[0].goals.total,
                assists: item.statistics[0].goals.assists
            };
        });
        res.render('results', { results: results, functionName: 'cercagiocatore' });
    });
    app.get('/bestvenuebycountry', async (req, res) => {
        const countryName = req.query.countryName;
        
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/venues',
            params: { country: countryName },
            headers: {
                    'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            };
        
            try {
                const response = await axios.request(options);
                const results = response.data.results;
                if (results > 0) {
                    const venue = response.data.response[0];
                    const message = `*Il miglior stadio in è:*\n\n` +
                        `Nome: ${venue.name}\n` +
                        `Indirizzo: ${venue.address}\n` +
                        `Città: ${venue.city}\n` +
                        `Capacità: ${venue.capacity}\n` +
                        `Superficie: ${venue.surface}\n\n` +
                        `[Visualizza immagine](${venue.image})`;
                    res.render('results_campi', { venue: venue, message: message });
                } else {
                    res.render('results_campi', { message: `Nessun stadio trovato per il paese ${countryName}` });
                }
            } catch (error) {
                console.error(error);
                res.render('results_campi', { message: 'Si è verificato un errore durante la ricerca del miglior stadio.' });
            }
        });
    
        // Renderizza il template EJS "results.ejs" con i risultati della ricerca
    
    app.get('/cercalega', async (req, res) => {
        const leagueName = req.query.leagueName;
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/leagues',
            headers: {
                'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                name: leagueName
            }
            };
            try {
            const response = await axios.request(options);
            const leagues = response.data.response;
            if (leagues.length === 0) {
                res.render('results_leghe', { league: null, error: `Non ci sono leghe disponibili con il nome: ${leagueName}` });
                return;
            }
            const league = leagues[0];
            res.render('results_leghe', { league, error: null });
            } catch (error) {
            console.error(error);
            res.render('error');
            }
        });
        app.get('/classifica', async (req, res) => {
                const leagueName = req.query.leagueName;
                try {
                const leagueId = await GetIdLega(leagueName);
                const table = await getLeagueStandings(leagueId);
                const options = {
                    method: 'GET',
                    url: `https://api-football-v1.p.rapidapi.com/v3/leagues?id=${leagueId}`,
                    headers: {
                    'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                    }
                };
                const response = await axios.request(options);
                const leagueLogoUrl = response.data.response[0].league.logo;
                res.render('results_classifica', { table, leagueName, leagueLogoUrl });
                } catch (error) {
                console.error(error);
                res.render('error');
                }
            });
            app.get('/squadra', async (req, res) => {
                const teamName = req.query.teamName;
                const options = {
                    method: 'GET',
                    url: 'https://api-football-v1.p.rapidapi.com/v3/teams',
                    params: { search: teamName },
                    headers: {
                        'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                    }
                    };
                    try {
                    const response = await axios.request(options);
                    const results = response.data.results;
                    if (results > 0) {
                        const team = response.data.response[0].team;
                        if (team && team.name) {
                        res.render('results_team', { team });
                        } else {
                        res.render('error', { message: 'I dettagli della squadra non sono disponibili.' });
                        }
                    } else {
                        res.render('error', { message: `Nessuna squadra trovata con il nome ${teamName}` });
                    }
                    } catch (error) {
                    console.error(error);
                    res.render('error', { message: 'Si è verificato un errore durante la ricerca dei dettagli della squadra.' });
                    }
                });

                app.get('/bookmakers', async (req, res) => {
                    const options = {
                    method: 'GET',
                    url: 'https://api-football-v1.p.rapidapi.com/v3/odds/bookmakers',
                    headers: {
                        'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                    }
                    };
                    try {
                    const response = await axios(options);
                    const data = response.data;
                    res.render('results_bookmaker', { data });
                    } catch (error) {
                    console.error(error);
                    }
                });
            
        // Definisci la route per la homepage
        app.get('/', (req, res) => {
        res.render('index');
        });

    // Start the web server
    app.listen(3000, () => {
    console.log('attivo sulla porta 3000');
    });

    //bot di Telegram

bot.setMyCommands([
    { command: '/start', description: 'Avvia il bot' },
    { command: '/cercalega', description: '[nome lega]Mostra le leghe date da ricerca' },
    { command: '/cercagiocatore', description: '[nome giocatore] della [nome lega]Mostra i giocatori con le loro stats date da ricerca(stagione corrente)' },
    { command: '/bookmakers', description: 'Mostra i bookmakers ' },
    { command: '/classifica', description: '[nome lega]classifica per lega(stagione corrente) ' },
    { command: '/teamdetails', description: '[nome squadra]informazioni di una squadra ' },
    { command: '/migliorstadiopernazione', description: '[nazione] il miglior stadio di una nazione ' }

    ]);
    
    // Gestisci il comando /start
        bot.onText(/\/start/, (msg) => {
            const message = `Onorevoli signori, benvenuti nel bot del calcio!
        Sono qui per fornirvi ogni genere di informazione sul meraviglioso gioco del calcio: dalle ultime notizie alle classifiche, dalle statistiche dei giocatori ai dettagli sulle squadre e sugli stadi. Utilizzo l'API di football per garantire la massima precisione e completezza delle informazioni fornite.
        
        Vi invito a utilizzare i miei comandi per esplorare il vasto mondo del calcio:
        - /cercalega [nome lega]: Mostra le leghe date da ricerca
        - /cercagiocatore [nome giocatore] della [nome lega]: Mostra i giocatori con i loro dati date da ricerca
        - /bookmakers: Mostra i bookmakers
        - /classifica [nome lega]: Mostra la classifica per una determinata lega
        - /teamdetails [nome squadra]: Mostra le informazioni di una squadra
        - /migliorstadiopernazione [nazione]: Mostra il miglior stadio di una nazione`;
        
            bot.sendMessage(msg.chat.id, message);
        });
        bot.onText(/\/cercagiocatore (.+) della (.+)/, (msg, match) => {
            const playerName = match[1].toLowerCase();
            const leagueName = match[2].toLowerCase();
            
                GetIdLega(leagueName)
                .then(leagueId => {
                    const options = {
                    method: 'GET',
                    url: 'https://api-football-v1.p.rapidapi.com/v3/players',
                    headers: {
                        'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                    },
                    params: {
                        search: playerName,
                        league: leagueId
                    }
                    };
                    axios.request(options)
                    .then(function (response) {
                        const players = response.data.response;
                        if (players.length === 0) {
                        bot.sendMessage(msg.chat.id, `Nessun giocatore trovato con il nome "${playerName}" nella lega "${leagueName}"`);
                        return;
                        }
            
                        const player = players[0];
                        const playerName = player.player.name;
                        const playerTeam = player.statistics[0].team.name;
                        const playerBirthDate = player.player.birth.date;
                        const playerBirthPlace = player.player.birth.place;
                        const playerNationality = player.player.nationality;
                        const playerHeight = player.player.height;
                        const playerWeight = player.player.weight;
                        const playerPhotoUrl = player.player.photo;
                        const playerStats = player.statistics;
                        
                        const message = `Il giocatore "${playerName}" gioca nella squadra "${playerTeam}" ed è nato il ${playerBirthDate} a ${playerBirthPlace}. Ha nazionalità ${playerNationality}, è alto ${playerHeight} e pesa ${playerWeight}. 
            
            Statistiche:
            - Partite giocate: ${playerStats[0].games.appearences}
            - Minuti giocati: ${playerStats[0].games.minutes}
            - Gol: ${playerStats[0].goals.total}
            - Assist: ${playerStats[0].goals.assists}
            - Tiri: ${playerStats[0].shots.total}
            - Passaggi: ${playerStats[0].passes.total}
            - Tackle: ${playerStats[0].tackles.total}
            - Dribbling: ${playerStats[0].dribbles.attempts}
            - Falli: ${playerStats[0].fouls.committed}
            - Cartellini gialli: ${playerStats[0].cards.yellow}
            - Cartellini rossi: ${playerStats[0].cards.red}
            - Rigori segnati: ${playerStats[0].penalty.scored}
            - Rigori falliti: ${playerStats[0].penalty.missed}
            - Rigori subiti: ${playerStats[0].penalty.saved}`;
            
                        bot.sendMessage(msg.chat.id, message);
                        bot.sendPhoto(msg.chat.id, playerPhotoUrl);
                    })
                    .catch(function (error) {
                        console.error(error);
                        bot.sendMessage(msg.chat.id, `Si è verificato un errore durante la ricerca del giocatore "${playerName}" nella lega "${leagueName}": ${error.message}`);
                    });
                })
                .catch(error => {
                    console.error(error);
                    bot.sendMessage(msg.chat.id, `Si è verificato un errore durante la ricerca della lega "${leagueName}": ${error.message}`);
                });
            });
    bot.onText(/\/cercalega (.+)/, (msg, match) => {
        GetLegaByName(msg,match[1]);
        
    });
    
    
    bot.onText(/\/bookmakers/, async (msg) => {
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/odds/bookmakers',
            headers: {
            'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
        };
        
        try {
            const response = await axios.request(options);
            const bookmakers = response.data.response;
            const bookmakerNames = bookmakers.map((bookmaker) => bookmaker.name);
            const bookmakerMessage = bookmakerNames.join('\n');
            const message = `*Ecco l'elenco dei bookmaker disponibili:*\n\n${bookmakerMessage}`;
            bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error(error);
        }
        });
        
        bot.on('polling_error', (error) => {
        console.error(error);
    });
    bot.onText(/\/classifica (.+)/, async (msg, match) => {
        const leagueName = match[1];
        try {
            const leagueId = await GetIdLega(leagueName);
            const table = await getLeagueStandings(leagueId);
            const options = {
                method: 'GET',
                url: `https://api-football-v1.p.rapidapi.com/v3/leagues?id=${leagueId}`,
                headers: {
                    'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            };
            const response = await axios.request(options);
            const leagueLogoUrl = response.data.response[0].league.logo;
            const message = `*Classifica di ${leagueName}*\n[Logo della lega](${leagueLogoUrl})\n\n${table}`;
            bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error(error);
            bot.sendMessage(msg.chat.id, 'Errore durante il recupero della classifica.');
        }
    });
    bot.onText(/\/teamdetails (.+)/, (msg, match) => {
        const teamName = match[1];
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/teams',
            params: { search: teamName },
            headers: {
                'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
            };
            axios.request(options).then((response) => {
            const results = response.data.results;
            if (results > 0) {
                const team = response.data.response[0].team;
                if (team && team.name) {
                const message = `*Dettagli della squadra: ${team.name}*\n\n` +
                                `Codice: ${team.code}\n` +
                                `Paese: ${team.country}\n` +
                                `Fondazione: ${team.founded}\n` +
                                `Logo: ${team.logo}\n`;
                bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
                } else {
                bot.sendMessage(msg.chat.id, 'I dettagli della squadra non sono disponibili.');
                }
            } else {
                bot.sendMessage(msg.chat.id, `Nessuna squadra trovata con il nome ${teamName}`);
            }
            }).catch((error) => {
            console.error(error);
            bot.sendMessage(msg.chat.id, 'Si è verificato un errore durante la ricerca dei dettagli della squadra.');
            });
        });

        bot.onText(/\/migliorstadiopernazione (.+)/, (msg, match) => {
            const countryName = match[1];
            const options = {
                method: 'GET',
                url: 'https://api-football-v1.p.rapidapi.com/v3/venues',
                params: { country: countryName },
                headers: {
                    'X-RapidAPI-Key': '27992d3c24msh65ef48d0ff03eeap16a901jsna4563f8bab6f',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
                };
                axios.request(options)
                .then((response) => {
                    const results = response.data.results;
                    if (results > 0) {
                    const venue = response.data.response[0];
                    const message = `*Il miglior stadio in ${countryName} è:*\n\n` +
                        `Nome: ${venue.name}\n` +
                        `Indirizzo: ${venue.address}\n` +
                        `Città: ${venue.city}\n` +
                        `Capacità: ${venue.capacity}\n` +
                        `Superficie: ${venue.surface}\n\n` +
                        `[Visualizza immagine](${venue.image})`;
                    bot.sendPhoto(msg.chat.id, venue.image, {
                        caption: message,
                        parse_mode: 'Markdown'
                    });
                    } else {
                    bot.sendMessage(msg.chat.id, `Nessun stadio trovato per il paese ${countryName}`);
                    }
                })
                .catch((error) => {
                    console.error(error);
                    bot.sendMessage(msg.chat.id, 'Si è verificato un errore durante la ricerca del miglior stadio.');
                });
            });
    
    // Gestisci il comando /leghe
    // Gestisci il comando /leghe
    async function GetLegaByName(msg,leagueName){
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/leagues',
            headers: {
                'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                name: leagueName
            }
        };
    
        axios.request(options)
            .then(function (response) {
                const leagues = response.data.response;
                if (leagues.length === 0) {
                    bot.sendMessage(msg.chat.id, `Non ci sono leghe disponibili con il nome: ${leagueName}`);
                    return;
                }
                const league = leagues[0];
                bot.sendPhoto(msg.chat.id, league.league.logo, {
                    caption: `ID: ${league.league.id}\nNome: ${league.league.name}\nTipo: ${league.league.type}`
                });
                return;
            })
            .catch(function (error) {
                console.error(error);
                bot.sendMessage(msg.chat.id, 'Si è verificato un errore durante la ricerca delle leghe');
            });


    }
    async function GetIdLega(leagueName) {
        const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/leagues',
            headers: {
                'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            params: {
                name: leagueName
            }
        };
    
        try {
            const response = await axios.request(options);
            const leagues = response.data.response;
            if (leagues.length === 0) {
                throw new Error(`Non ci sono leghe disponibili con il nome: ${leagueName}`);
            }
            const league = leagues[0];
            console.log(league.league.id);
            return league.league.id;
        } catch (error) {
            console.error(error);
            throw new Error(`Si è verificato un errore durante la ricerca dell'ID della lega: ${error.message}`);
        }
    }

    async function getLeagueStandings(leagueId, season = '2022') {
        try {
            const options = {
                method: 'GET',
                url: `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${season}`,
                headers: {
                    'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            };
            const response = await axios.request(options);
            const standings = response.data.response[0].league.standings[0];
            const table = standings.map((team) => `${team.rank}. ${team.team.name} (${team.points} pts)`);
            return table.join('\n');
        } catch (error) {
            console.error(error);
            throw new Error('Errore durante il recupero della classifica.');
        }
    }