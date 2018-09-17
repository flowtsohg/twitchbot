let fetch = require('node-fetch');

/**
 * @param {Channel} channel
 * @param {object} stream
 */
async function trackPlayer(channel, stream) {
  if (stream) {
    let stats = channel.settings.wc3stats;

    if (stats) {
      let player = stats.player;
      let response = await fetch(`http://classic.battle.net/war3/ladder/W3XP-player-profile.aspx?Gateway=Northrend&PlayerName=${player}`);
      let text = await response.text();
      let solo = getSoloOrTeamStats(text, 'Solo');
      let team = getSoloOrTeamStats(text, 'Team');

      stats.stats = [...solo, ...team];

      channel.log(`Tracking the stats of @${player}.`);
    }
  }
}

/**
 * @param {string} text
 * @param {string} type
 * @return {object}
 */
function getSoloOrTeamStats(text, type) {
  let wins = 0;
  let losses = 0;
  let offset = text.indexOf(`${type} Games`);

  if (offset > -1) {
    let winsStart = text.indexOf('"small"', text.indexOf('Wins:', offset)) + 8;
    let winsEnd = text.indexOf('<', winsStart);
    let lossesStart = text.indexOf('"small"', text.indexOf('Losses:', offset)) + 8;
    let lossesEnd = text.indexOf('<', lossesStart);

    wins = parseInt(text.slice(winsStart, winsEnd)) || 0;
    losses = parseInt(text.slice(lossesStart, lossesEnd)) || 0;
  }

  return [wins, losses];
}

/**
 * @param {number} wins
 * @param {number} losses
 * @return {string}
 */
function statsToString(wins, losses) {
  let games = wins + losses;
  let percentage = (wins / games) * 100;
  let hasPercentage = !isNaN(percentage) && percentage > 1;

  return `${wins}:${losses}${hasPercentage ? ` (${percentage.toFixed(2)}%)` : ''}`;
}

/**
 * @param {string} player
 * @param {Array<number>} base
 * @return {Promise<Array<number>>}
 */
async function getPlayerStats(player, base) {
  let response = await fetch(`http://classic.battle.net/war3/ladder/W3XP-player-profile.aspx?Gateway=Northrend&PlayerName=${player}`);
  let text = await response.text();
  let solo = getSoloOrTeamStats(text, 'Solo');
  let team = getSoloOrTeamStats(text, 'Team');

  if (base) {
    solo[0] -= base[0];
    solo[1] -= base[1];
    team[0] -= base[2];
    team[1] -= base[3];
  }

  return [...solo, ...team];
}

/**
 * @param {Channel} channel
 * @param {string} player
 * @param {?Array<number>} base
 */
async function messagePlayerStats(channel, player, base) {
  let stats = await getPlayerStats(player, base);

  channel.message(`@${player}: Solo - ${statsToString(stats[0], stats[1])}, Team - ${statsToString(stats[2], stats[3])}`);
}

module.exports = {
  name: 'wc3stats',

  async eachChannel(channel) {
    channel.on('live', trackPlayer);
  },

  async handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      return;
    }

    let op = args[0].toLowerCase();

    if (op === 'get') {
      if (args.length < 2) {
        channel.message(`@${user.name} add a player.`);
        return;
      }

      messagePlayerStats(channel, args[1].toLowerCase());
    } else if (op === 'track') {
      let player = args[1].toLowerCase();

      // If tracking was already on, remove the event handler.
      if (channel.settings.wc3stats) {
        channel.off('live', trackPlayer);
      }

      channel.settings.wc3stats = {player, stats: await getPlayerStats(player)};

      // Now add the event handler again.
      channel.on('live', trackPlayer);

      channel.message(`Tracking the stats of @${player}.`);
    } else if (op === 'diff') {
      if (channel.settings.wc3stats) {
        messagePlayerStats(channel, channel.settings.wc3stats.player, channel.settings.wc3stats.stats);
      } else {
        channel.message(`Not tracking anyone.`);
      }
    } else if (op === 'tracked') {
      let stats = channel.settings.wc3stats;

      if (stats) {
        channel.message(`@${stats.player} is being tracked.`);
      } else {
        channel.message('No one is being tracked.');
      }
    } else if (op === 'untrack') {
      if (channel.settings.wc3stats) {
        channel.off('live', trackPlayer);
      }

      delete channel.settings.wc3stats;

      channel.message('Done.');
    } else {
      channel.message(`What is "${op}"?`);
    }
  },
};
