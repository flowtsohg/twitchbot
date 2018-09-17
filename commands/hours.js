module.exports = {
  name: 'hours',

  eachUser(user) {
    user.seconds = 0;
  },

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    channel.message(`@${user.name}, ${Math.floor(user.seconds / 360) / 10} hours.`);
  },
};
