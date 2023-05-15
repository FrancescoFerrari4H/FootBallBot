    const program = require('commander');
    const axios = require('axios');

    program
    .version('1.0.0')
    .description('Descrizione del tuo bot.')
    .option('-s, --standings <nome_lega>', 'Mostra la classifica per la lega(stagione corrente)')
    .option('-b, --bookmakers', 'Mostra l\'elenco dei bookmaker disponibili')
    .parse(process.argv);

    if (program.standings) {
        console.log(program.standings);
    const leagueName = program.standings;
        try {
        const leagueId = GetIdLega(leagueName);
        const table = getLeagueStandings(leagueId);
        const options = {
            method: 'GET',
            url: `https://api-football-v1.p.rapidapi.com/v3/leagues?id=${leagueId}`,
            headers: {
            'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
        };
        const response = axios.request(options);
        const leagueLogoUrl = response.data.response[0].league.logo;
        const message = `*Classifica di ${leagueName}*\n[Logo della lega](${leagueLogoUrl})\n\n${table}`;
        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, 'Errore durante il recupero della classifica.');
        }
    }

    if (program.bookmakers) {
    const options = {
        method: 'GET',
        url: 'https://api-football-v1.p.rapidapi.com/v3/odds/bookmakers',
        headers: {
        'X-RapidAPI-Key': '7ce5e3dd38msh7e61d1893740d9bp10b7cajsn22cfc2156b63',
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
    };
    
    try {
        const response =  axios.request(options);
        const bookmakers = response.data.response;
        const bookmakerNames = bookmakers.map((bookmaker) => bookmaker.name);
        const bookmakerMessage = bookmakerNames.join('\n');
        const message = `*Ecco l'elenco dei bookmaker disponibili:*\n\n${bookmakerMessage}`;
        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(error);
    }
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
            const response =  axios.request(options);
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
            const response = axios.request(options);
            const standings = response.data.response[0].league.standings[0];
            const table = standings.map((team) => `${team.rank}. ${team.team.name} (${team.points} pts)`);
            return table.join('\n');
        } catch (error) {
            console.error(error);
            throw new Error('Errore durante il recupero della classifica.');
        }
    }