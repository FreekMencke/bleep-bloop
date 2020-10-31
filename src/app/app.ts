import { Client, Message, PartialMessage, TextChannel } from 'discord.js';
import { CommandParser } from './commands/command-parser';
import { config } from './config/config';
import { GameRoleManager } from './games/game-role.manager';

export class App {
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
    await this.gameRoleManager.init(this.client);

    this.client.on('message', msg => this.onMessage(msg));
    this.client.on('messageUpdate', (_, msg) => this.onMessage(msg));
  }

  private async onMessage(message: Message | PartialMessage) {
    if (!(message.channel instanceof TextChannel) || message.channel.name !== config.botChannel) return;

    const messageStr = message.toString();
    if (messageStr.startsWith('!')) this.commandParser.parse(message);
  }
}
