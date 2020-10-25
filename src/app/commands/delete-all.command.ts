import { Message, PartialMessage, TextChannel, User } from 'discord.js';
import { Logger } from '../common/logger';
import { Command } from './command.interface';

export class DeleteAllCommand implements Command {
  readonly CLASS_NAME: string = 'DELETE_ALL_COMMAND';

  constructor(
    private message: Message | PartialMessage,
    private users: User[],
  ) { }

  async execute(): Promise<any> {
    const usernameList = this.getList(this.users.map(usr => usr.username));
    Logger.log(this.CLASS_NAME + ': STARTED DELETING ALL MESSAGES FOR', usernameList);

    const channel = this.message.channel as TextChannel;
    await channel.messages.fetch({ limit: 100 });

    await Promise.all(this.users.map(async user => {
      const userMessages = Array.from(channel.messages.cache.values())
        .filter(msg => msg.author.id === user!.id)
        .filter(msg => msg.id !== this.message.id);

      return channel.bulkDelete(userMessages);
    }));

    Logger.log(this.CLASS_NAME + ': FINISHED DELETING ALL MESSAGES FOR', usernameList);
    await this.message.delete();

    const userMentions = this.getList(this.users.map(usr => this.getMention(usr)));
    return channel.send(`Deleted all messages for ${userMentions} in the last 100 messages`);
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
