import { Client, Message, PartialMessage, TextChannel } from 'discord.js';
import { CommandParser } from './commands/command-parser';
import { config } from './config/config';
import { GameRoleManager } from './games/game-role.manager';

export class App {
  readonly CLASS_NAME: string = 'SYSTEM:';

  client: Client = new Client();

  commandParser: CommandParser = new CommandParser();
  gameRoleManager: GameRoleManager = new GameRoleManager();

  static run(): App {
    const app = new App();
    app.start();
    return app;
  }

  private async start(): Promise<void> {
    await this.client.login(config.token);
    await this.initCategory();
    await this.gameRoleManager.init(this.client);

    this.client.on('message', msg => this.onMessage(msg));
    this.client.on('messageUpdate', (_, msg) => this.onMessage(msg));
  }

  private async onMessage(message: Message | PartialMessage) {
    if (message.guild!.id !== config.guild) return;
    if (!(message.channel instanceof TextChannel) || message.channel.name !== config.botChannel) return;

    const messageStr = message.toString();
    if (messageStr.startsWith('!')) this.commandParser.parse(message);
  }

  private async initCategory() {
    const guild = await (await this.client.guilds.fetch(config.guild)).fetch();
    const botCategory = guild.channels.cache.find(channel => channel.name === config.botCategory && channel.type === 'category')
      ?? await guild.channels.create(config.botCategory, { type: 'category', position: 1000 });
    if (!botCategory) throw Error('CATEGORY ' + config.botCategory + ' NOT FOUND');
  }
}
