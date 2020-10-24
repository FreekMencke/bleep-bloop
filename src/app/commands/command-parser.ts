import { Message, PartialMessage, TextChannel, User } from 'discord.js';
import { Logger } from '../common/logger';

export class CommandParser {
  readonly CLASS_NAME: string = 'COMMAND_PARSER';

  async parse(message: Message | PartialMessage): Promise<void> {
    Logger.log(this.CLASS_NAME + ': RECEIVED COMMAND', `"${message.toString()}"`, 'FROM', message.author!.username);

    const command = message.toString().substring(1).split(' ');

    switch(command[0]) {
      case 'react':
        this.react(message, command[1]);
        break;
      case 'delete-all':
      case 'da':
        const users = message.mentions.users.array();
        if(users.length === 0) {
          Logger.log(this.CLASS_NAME + ': COMMAND "delete-all" FROM', message.author!.username, 'CONTAINED NO PARAMETERS');
          await message.delete();
          break;
        }
        this.deleteAll(message, users);
        break;
      default:
        Logger.log(this.CLASS_NAME + ': COMMAND', `"${message.toString()}"`, 'NOT FOUND');
    }
  }

  private async react(message: Message | PartialMessage, emote: string): Promise<any> {
    const emoteResult = message.guild!.emojis.cache.find(emoji => emoji.name === emote);

    if(!emoteResult) {
      Logger.log(this.CLASS_NAME + ': FAILED TO FIND EMOTE', `"${emote}"`);
      return message.delete();
    }
    Logger.log(this.CLASS_NAME + ': ADDED EMOTE', `"${emote}"`, 'AS REACTION TO MESSAGE FOR', message.author!.username);
    return message.react(emoteResult);
  }

  private async deleteAll(message: Message | PartialMessage, users: User[]): Promise<void> {
    const usernameList = this.getList(users.map(usr => usr.username));
    Logger.log(this.CLASS_NAME + ': STARTED DELETING ALL MESSAGES FOR', usernameList);

    const channel = message.channel as TextChannel;
    await channel.messages.fetch({ limit: 100 });

    await Promise.all(users.map(async user => {
      const userMessages = Array.from(channel.messages.cache.values())
        .filter(msg => msg.author.id === user!.id)
        .filter(msg => msg.id !== message.id);

      return channel.bulkDelete(userMessages);
    }));

    Logger.log(this.CLASS_NAME + ': FINISHED DELETING ALL MESSAGES FOR', usernameList);
    await message.delete();

    const userMentions = this.getList(users.map(usr => this.getMention(usr)));
    channel.send(`Deleted all messages for ${userMentions} in the last 100 messages`);
  }

  private getList(string: string[]): string {
    return string.reduce((acc, string) => {
      if (acc.length> 0) acc += ', ';
      return acc += string;
    }, '');
  }

  private getMention(user: User): string {
    return `<@!${user.id}>`;
  }

}
