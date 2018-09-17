// [<any>]
module.exports = {
  name: 'mute',

  handler(channel, command, event, args) {
    if (args.length > 0) {
      channel.muted = true;
      channel.queue.length = 0;
    } else {
      channel.muted = false;
      channel.message('Hello again!');
    }
  },
};
