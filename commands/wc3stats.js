let fetch = require('node-fetch');

/**
 * @param {Channel} channel
 * @param {Object} stream
 */
async function trackPlayer(channel, stream) {
  if (stream) {
    let stats = channel.settings.wc3stats;

    if (stats) {
      stats.stats = await getPlayerStats(stats.player);

      channel.log(`Tracking the stats of @${stats.player}.`);
    }
  }
}

/**
 * @param {string} text
 * @param {number} offset
 * @return {Object}
 */
function getStatsFromOffset(text, offset) {
  if (offset > -1) {
    offset = text.indexOf('Wins:', offset);

    if (offset !== -1) {
      let winsStart = text.indexOf('"small"', offset) + 8;
      let winsEnd = text.indexOf('<', winsStart);
      let lossesStart = text.indexOf('"small"', text.indexOf('Losses:', offset)) + 8;
      let lossesEnd = text.indexOf('<', lossesStart);

      return {offset: lossesEnd, wins: parseInt(text.slice(winsStart, winsEnd)) || 0, losses: parseInt(text.slice(lossesStart, lossesEnd)) || 0};
    }
  }

  return {offset: -1, wins: 0, losses: 0};
}

/**
 * @param {string} text
 * @return {Object}
 */
function getATStats(text) {
  let wins = 0;
  let losses = 0;
  let offset = -1;
  let stats = getStatsFromOffset(text, text.indexOf('class="header4">Arranged Teams'));

  while (stats.offset !== -1) {
    wins += stats.wins;
    losses += stats.losses;
    offset = stats.offset;

    stats = getStatsFromOffset(text, offset);
  }

  return {offset, wins, losses};
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
 * @param {?Array<number>} base
 * @return {Promise<Array<number>>}
 */
async function getPlayerStats(player, base) {
  let response = await fetch(`http://classic.battle.net/war3/ladder/W3XP-player-profile.aspx?Gateway=Northrend&PlayerName=${player}`);
  let text = await response.text();
  let solo = getStatsFromOffset(text, text.indexOf('class="header4">Solo Games'));
  let rt = getStatsFromOffset(text, text.indexOf('class="header4">Team Games'));
  let at = getATStats(text);

  if (base) {
    solo.wins -= base[0];
    solo.losses -= base[1];
    rt.wins -= base[2];
    rt.losses -= base[3];
    at.wins -= base[4];
    at.losses -= base[5];
  }

  return [solo.wins, solo.losses, rt.wins, rt.losses, at.wins, at.losses];
}

/**
 * @param {Channel} channel
 * @param {string} player
 * @param {?Array<number>} base
 */
async function messagePlayerStats(channel, player, base) {
  let stats = await getPlayerStats(player, base);

  channel.message(`@${player}: Solo - ${statsToString(stats[0], stats[1])}, RT - ${statsToString(stats[2], stats[3])}, AT - ${statsToString(stats[4], stats[5])}`);
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
