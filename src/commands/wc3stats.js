let fetch = require('node-fetch'),
    JSDOM = require('jsdom').JSDOM;

function parseRealm(realm) {
    if ('northrend'.startsWith(realm)) {
        return'northrend';
    } else if ('lordaeron'.startsWith(realm)) {
        return 'lordaeron';
    } else if ('azeroth'.startsWith(realm)) {
        return 'azeroth';
    } else if ('kalimdor'.startsWith(realm)) {
        return 'kalimdor';
    } else if ('w3arena'.startsWith(realm)) {
        return 'w3arena';
    }
}

function parseRace(race) {
    if ('random'.startsWith(race) || race === 'rnd' || race === 'rdm') {
        return 'random';
    } else if ('human'.startsWith(race)) {
        return 'human';
    } else if ('orc'.startsWith(race)) {
        return 'orc';
    } else if ('undead'.startsWith(race) || race === 'ud') {
        return 'undead';
    } else if ('nightelf'.startsWith(race) || race === 'ne') {
        return 'nightelf';
    } else if ('total'.startsWith(race)) {
        return 'total';
    }

    return '';
}

function getBnetRaceRow(rows, race) {
    for (let row of rows) {
        let rowRace = row.querySelector('.rankingHeader').textContent;

        if ((race === 'total' && rowRace === 'Total:') ||
            (race === 'random' && rowRace === 'Random:') ||
            (race === 'human' && rowRace === 'Human:') ||
            (race === 'orc' && rowRace === 'Orc:') ||
            (race === 'undead' && rowRace === 'Undead:') ||
            (race === 'nightelf' && rowRace === 'Night Elf:')) {
            return row;
        }
    }
}

// args: <mode> <user> <user|race|all>
// e.g.: solo 
module.exports = {
    name: 'wc3stats',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 3) {
            channel.chatMessage(`@${user}, usage: ${command.name} <realm> <user> [<race>].`);
            channel.chatMessage(`gets the solo ladder win:loss of the given user at the given realm.`);
            return;
        }

        let arg1 = args[1].toLowerCase(),
            arg2 = args[2],
            realm = parseRealm(arg1);

        if (realm === '') {
            channel.chatMessage(`@${user}, '${arg1}' is not a valid realm`);
            return;
        }

        let arg3 = 'total';

        if (args.length > 3) {
            arg3 = args[3].toLowerCase();
        }

        if (realm === 'w3arena') {
            fetch(`http://tft.w3arena.net/profile/${arg2}`)
                .then((response) => {
                    return response.text();
                })
                .then((text) => {
                    let document = new JSDOM(text).window.document,
                        profileContainer = document.querySelector('.profileContainer');

                    if (!profileContainer) {
                        channel.chatMessage(`@${user}, '${arg2}' is not a valid w3arena user.`);
                        return;
                    }

                    let name = profileContainer.querySelector('.basicData > .innerDescriptionBox > div').textContent.trim();

                    let leftColumn = profileContainer.querySelector('.leftColumn');

                    let stats = leftColumn.querySelector('.tabContainer');

                    let soloStats = stats.querySelector('#solo');
                    let soloRank = soloStats.querySelector('.rank > strong').textContent;
                    //console.log('solo rank', soloRank);
                    let soloWinLoss = soloStats.querySelector('.winLossContainer');
                    let soloWins = soloWinLoss.querySelector('.winBar').textContent.split(' ')[0];
                    //console.log('solo wins', soloWins);
                    let soloLosses = soloWinLoss.querySelector('.lossBar').textContent.split(' ')[0];
                    //console.log('solo losses', soloLosses);
                    let soloLevel = soloStats.querySelector('.level').textContent.split(' ')[1];
                    //console.log('solo level', soloLevel);
                    let soloExperience = soloStats.querySelector('.progressContainer > .experience').textContent.split(' ')[1];
                    //console.log('solo exp', soloExperience);
                    let rtStats = stats.querySelector('#randomTeam');
                    // TODO: get RT stats

                    let atStats = stats.querySelector('#arrangedTeam');
                    // TODO: get AT stats

                    let gameSummary = leftColumn.querySelector('.gameSummary');

                    channel.chatMessage(`@${user}, ${arg2} at ${realm} ${soloWins}:${soloLosses}.`);
                });
        } else {
            fetch(`http://classic.battle.net/war3/ladder/war3-player-profile.aspx?Gateway=${realm}&PlayerName=${arg2}`)
                .then((response) => {
                    return response.text();
                })
                .then((text) => {
                    let document = new JSDOM(text).window.document,
                        ladderTable = document.querySelector('.ladderTableGray');

                    if (ladderTable) {
                        let race = parseRace(arg3);

                        // If the user supplied a race but it's invalid, say so.
                        if (race === '') {
                            channel.chatMessage(`@${user}, '${arg3}' is not a valid race.`);
                            return;
                        }

                        let rows = ladderTable.querySelectorAll('tr'),
                            row = getBnetRaceRow(rows, race);
                       
                        // If the row is not found, it means the player hasn't played with that race.
                        if (!row) {
                            channel.chatMessage(`@${user}, ${arg2} at ${realm} as ${race} - 0:0.`);
                            return;
                        }

                        let rankingRows = row.querySelectorAll('.rankingRow'),
                            wins = rankingRows[0].textContent,
                            losses = rankingRows[1].textContent;

                        // Either the user supplied 'total', or he didn't support any race.
                        // In both there is no reason to write the race.
                        if (arg3 === 'total') {
                            channel.chatMessage(`@${user}, ${arg2} at ${realm} - ${wins}:${losses}.`);
                        } else {
                            channel.chatMessage(`@${user}, ${arg2} at ${realm} as ${race} - ${wins}:${losses}.`);
                        }
                    } else {
                        channel.chatMessage(`@${user}, ${arg2} at ${realm} is not a valid ${realm} user.`);
                    }
                });
        }

        
    }
};
