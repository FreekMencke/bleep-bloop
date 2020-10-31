import { Client, Message, TextChannel } from 'discord.js';
import { Logger } from '../common/logger';
import { config } from '../config/config';

export class GameRoleManager {
  readonly CLASS_NAME: string = 'GAME_ROLE_MANAGER';

  gameRoleChannel!: TextChannel;
  gameRoleMessage!: Message;

  async init(client: Client) {
    const guild = await (await client.guilds.fetch('319680848578215938')).fetch();
    const channel = guild.channels.cache.find(channel => channel.name === config.botChannel && channel.type === 'text');

    if (!channel) {
      throw Error(config.botChannel + ' is not a text channel.');
    }
    this.gameRoleChannel = (await channel.fetch()) as TextChannel;
    await this.gameRoleChannel.messages.fetch();

    this.createGameRoleMessage(client);
  }

  private async createGameRoleMessage(client: Client): Promise<void> {
    const botMessages = Array.from(this.gameRoleChannel.messages.cache.values()).filter(
      message => message.author.id === client.user!.id && message.pinned,
    );

    if (botMessages.length === 0) {
      this.gameRoleMessage = await this.gameRoleChannel.send('Game message placeholder');
      await this.gameRoleMessage.pin();

      Logger.log(this.CLASS_NAME + ': CREATED GAME ROLE MESSAGE IN:', config.botChannel);
    } else {
      this.gameRoleMessage = botMessages[0];

      Logger.log(this.CLASS_NAME + ': GAME ROLE MESSAGE IN', `"${config.botChannel}"`, 'ALREADY EXISTS');
    }
  }
}
