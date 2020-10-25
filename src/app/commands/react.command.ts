import { Message, PartialMessage } from 'discord.js';
import { Logger } from '../common/logger';
import { Command } from './command.interface';

export class ReactCommand implements Command {
  readonly CLASS_NAME: string = 'REACT_COMMAND';

  constructor(
    private message: Message | PartialMessage,
    private emote: string,
  ) { }

  execute(): Promise<any> {
    const emoteResult = this.message.guild!.emojis.cache.find(emoji => emoji.name === this.emote);

    if(!emoteResult) {
      Logger.log(this.CLASS_NAME + ': FAILED TO FIND EMOTE', `"${this.emote}"`);
      return this.message.delete();
    }
    Logger.log(this.CLASS_NAME + ': ADDED EMOTE', `"${this.emote}"`, 'AS REACTION TO MESSAGE FOR', this.message.author!.username);
    return this.message.react(emoteResult);
  }

}
