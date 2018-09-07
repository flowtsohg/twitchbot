function parseRealm(realm) {
    realm = realm.toLowerCase();

    if ('northrend'.startsWith(realm)) {
        return 'northrend';
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

// args: <realm> <user>
module.exports = {
    name: 'wc3stats',

    handler(channel, command, event, args) {
        let user = channel.users.get(event.user),
            userName = user.displayName || user.name;

        if (args.length < 2) {
            channel.message(`@${userName}, usage: ${command.name} <realm> <user>`);
            return;
        }

        let realm = parseRealm(args[0]),
            player = args[1].toLowerCase();

        if (realm === '') {
            channel.message(`@${userName}, "${arg1}" is not a valid realm!`);
        } else if (realm === 'w3arena') {
            channel.message(`@${userName}, http://tft.w3arena.net/profile/${player}`);
        } else {
            channel.message(`@${userName}, http://classic.battle.net/war3/ladder/w3xp-player-reports-overall.aspx?Gateway=${realm}&PlayerName=${player}`);
        }
    }
};
