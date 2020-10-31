import { Message, PartialMessage } from 'discord.js';
import { Logger } from '../common/logger';
import { Command } from './command.interface';
import { DeleteAllCommand } from './delete-all.command';
import { ErrorCommand } from './error.command';
import { ReactCommand } from './react.command';

export class CommandParser {
  readonly CLASS_NAME: string = 'COMMAND_PARSER';

  async parse(message: Message | PartialMessage): Promise<void> {
    Logger.log(this.CLASS_NAME + ': RECEIVED COMMAND', `"${message.toString()}"`, 'FROM', message.author!.username);

    const command = await this.getCommand(message);

    command!.execute();
  }

  private async getCommand(message: Message | PartialMessage): Promise<Command> {
    const commandArgs = message.toString().substring(1).split(' ');

    switch (commandArgs[0]) {
      case 'react':
        return new ReactCommand(message, commandArgs[1]);
      case 'delete-all':
      case 'da':
        const users = message.mentions.users.array();
        if (users.length === 0) {
          Logger.log(
            this.CLASS_NAME + ': COMMAND "delete-all" FROM',
            message.author!.username,
            'CONTAINED NO PARAMETERS',
          );
          await message.delete();
          return new ErrorCommand('FAILED TO EXECUTE "delete-all"');
        }
        return new DeleteAllCommand(message, users);
      default:
        return new ErrorCommand('COMMAND', `"${message.toString()}"`, 'NOT FOUND');
    }
  }
}
