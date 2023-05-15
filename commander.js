    const program = require('commander');
    const axios = require('axios');

    program
    .description('Recupera il miglior stadio di una determinata nazione.')
    .option('-n, --nazione <nome_nazione>', 'Il nome della nazione di cui recuperare il miglior stadio.')
    .action(() => {
        if (!program.opts().nazione) {
        console.error('Devi specificare il nome della nazione.');
        return;
        }
        const countryName = program.opts().nazione;
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
            console.log(message);
            } else {
            console.log(`Nessun stadio trovato per il paese ${countryName}`);
            }
        })
        .catch((error) => {
            console.error(error);
            console.log('Si è verificato un errore durante la ricerca del miglior stadio.');
        });
    });

    program.parse(process.argv);

    if (program.args.length === 0) {
    console.error('Devi specificare un comando.');
    program.help();
    }