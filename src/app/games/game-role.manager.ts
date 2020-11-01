import {
  CategoryChannel,
  Client,
  Guild,
  Message,
  MessageEmbed,
  MessageReaction,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import { Logger } from '../common/logger';
import { config } from '../config/config';
import { Game, GameData } from './game-models';

export class GameRoleManager {
  readonly CLASS_NAME: string = 'GAME_ROLE_MANAGER:';

  guild!: Guild;
  everyoneRole!: Role;
  gamesRole!: Role;
  botCategory!: CategoryChannel;
  gameCategory!: CategoryChannel;
  gameDataChannel!: TextChannel;
  gameRoleChannel!: TextChannel;
  gameRoleMessage!: Message;

  async init(client: Client) {
    this.guild = await (await client.guilds.fetch(config.guild)).fetch();

    this.everyoneRole = this.guild.roles.cache.find(role => role.name === '@everyone')!;
    this.gamesRole =
      this.guild.roles.cache.find(role => role.name === config.gamesRoleName) ??
      (await this.guild.roles.create({ data: { name: config.gamesRoleName, color: 'WHITE' } }));

    this.botCategory = (await this.guild.channels.cache
      .find(channel => channel.name === config.botCategory && channel.type === 'category')!
      .fetch()) as CategoryChannel;

    this.gameCategory = (await (
      this.guild.channels.cache.find(channel => channel.name === config.gameCategory && channel.type === 'category') ??
      (await this.guild.channels.create(config.gameCategory, { type: 'category' }))
    ).fetch()) as CategoryChannel;

    this.gameRoleChannel = (await (
      this.guild.channels.cache.find(channel => channel.name === config.gameRoleChannel && channel.type === 'text') ??
      (await this.guild.channels.create(config.gameRoleChannel, {
        type: 'text',
        position: 0,
        permissionOverwrites: [{ deny: ['SEND_MESSAGES', 'ADD_REACTIONS'], id: this.everyoneRole }],
      }))
    ).fetch()) as TextChannel;

    this.gameDataChannel = (await (
      this.guild.channels.cache.find(channel => channel.name === config.gameDataChannel && channel.type === 'text') ??
      (await this.guild.channels.create(config.gameDataChannel, {
        type: 'text',
        parent: this.botCategory,
        permissionOverwrites: [{ deny: ['VIEW_CHANNEL'], id: this.everyoneRole }],
      }))
    ).fetch()) as TextChannel;

    Logger.log(this.CLASS_NAME, 'FOUND', config.gameRoleChannel, 'AND', config.gameDataChannel, 'TEXT CHANNEL.');

    await this.gameRoleChannel.messages.fetch();

    await this.initData();
    await this.createGameRoleMessage();
    await this.sortChannelsAndRoles();

    this.gameDataChannel
      .createMessageCollector((message: Message) => message.author.id !== message.client.user?.id)
      .on('collect', message => this.processGameDataMessage(message));

    this.gameRoleMessage
      .createReactionCollector(
        (message: MessageReaction, reactingUser: User) => reactingUser.id !== reactingUser.client.user?.id,
      )
      .on('collect', (message: MessageReaction, reactingUser: User) =>
        this.processGameRoleMessageReaction(message, reactingUser),
      );

    Logger.log(this.CLASS_NAME, 'FINISHED INITIALISING');
  }

  private async processGameDataMessage(message: Message) {
    Logger.log(this.CLASS_NAME, 'PROCESSING GAME DATA MESSAGE', message.content);
    try {
      const game = JSON.parse(message.content) as Game;
      const games = await this.fetchGameDatas();

      if (games.find(g => g.channelName === game.channelName)) throw 'DUPLICATE CHANNEL NAME';

      const foundGame = games.find(g => g.id == game.id);
      if (foundGame) {
        Logger.log(this.CLASS_NAME, 'EXISTING GAME');
        await this.updateGame(foundGame, game);
      } else {
        Logger.log(this.CLASS_NAME, 'NEW GAME');
        await this.addGame(game);
      }
      await message.delete();
      await this.sortChannelsAndRoles();
      await this.createGameRoleMessage();
    } catch (err) {
      Logger.log(this.CLASS_NAME, 'FAILED TO PARSE INPUT');
      Logger.log(this.CLASS_NAME, err);
    }
  }

  private async processGameRoleMessageReaction(message: MessageReaction, reactingUser: User) {
    const games = await this.fetchGameDatas();

    Logger.log(this.CLASS_NAME, 'USER', reactingUser.username, 'REACTED WITH', message.emoji.name);
    const guildMember = await (await this.guild.members.fetch(reactingUser.id)).fetch();
    const guildMemberRoles = guildMember.roles.cache.array();
    const game = games.find(game => game.emoji === message.emoji.name)!;

    if (guildMemberRoles.some(role => role.name === game.roleName)) {
      await guildMember.roles.remove(game.role!);
      Logger.log(this.CLASS_NAME, 'REMOVED ROLE', game.roleName, 'FROM USER', reactingUser.username);
    } else {
      if (!guildMemberRoles.find(guildMemberRole => guildMemberRole.name === config.gamesRoleName))
        await guildMember.roles.add(this.gamesRole);
      await guildMember.roles.add(game.role!);
      Logger.log(this.CLASS_NAME, 'ADDED ROLE', game.roleName, 'TO USER', reactingUser.username);
    }

    await message.users.remove(reactingUser.id);
  }

  private async initData() {
    await this.gameDataChannel.messages.fetch();
    await this.guild.fetch();
    await this.guild.roles.fetch();

    await Promise.all(
      this.gameDataChannel.messages.cache.map(async dataMessage => {
        const game = JSON.parse(dataMessage.content) as Game;
        const role =
          this.guild.roles.cache.find(role => role.name === game.roleName) ??
          (await this.guild.roles.create({ data: { name: game.roleName, color: parseInt(game.color, 16) } }));

        let channel = this.guild.channels.cache.find(channel => channel.name === game.channelName);
        if (channel) {
          channel.overwritePermissions([
            { deny: ['VIEW_CHANNEL'], id: this.everyoneRole },
            { allow: ['VIEW_CHANNEL'], id: role },
          ]);
        } else {
          channel = await this.guild.channels.create(game.channelName, {
            type: 'text',
            parent: this.gameCategory,
            permissionOverwrites: [
              { deny: ['VIEW_CHANNEL'], id: this.everyoneRole },
              { allow: ['VIEW_CHANNEL'], id: role },
            ],
          });
        }
      }),
    );
  }

  private async fetchGames() {
    await this.gameDataChannel.fetch();
    return this.gameDataChannel.messages.cache
      .filter(m => m.author.id === m.client.user?.id)
      .map(m => JSON.parse(m.content) as Game);
  }

  private async fetchGameDatas() {
    await this.guild.fetch();
    await this.gameDataChannel.fetch();
    return this.gameDataChannel.messages.cache
      .filter(m => m.author.id === m.client.user?.id)
      .map(m => [m, JSON.parse(m.content)])
      .map(([m, parsedContent]) => ({
        ...parsedContent,
        message: m,
        role: this.guild.roles.cache.find(r => r.name === parsedContent.roleName)!,
        channel: this.guild.channels.cache.find(c => c.name === parsedContent.channelName) as TextChannel,
      }));
  }

  private async addGame(gameInput: Game) {
    await this.guild.roles.fetch();
    const role =
      this.guild.roles.cache.find(role => role.name === gameInput.roleName) ??
      (await this.guild.roles.create({ data: { name: gameInput.roleName, color: parseInt(gameInput.color, 16) } }));
    await this.gameDataChannel.send(JSON.stringify(gameInput));
    await this.guild.channels.create(gameInput.channelName, {
      type: 'text',
      parent: this.gameCategory,
      permissionOverwrites: [
        { deny: ['VIEW_CHANNEL'], id: this.everyoneRole },
        { allow: ['VIEW_CHANNEL'], id: role },
      ],
    });
    Logger.log(this.CLASS_NAME, 'ADDED GAME', gameInput.name, 'REFRESHING GAME ROLE MESSAGE');
  }

  private async updateGame(originalGame: GameData, newGame: Game) {
    await originalGame.role.setName(newGame.roleName);
    await originalGame.role.setColor(newGame.color);
    await originalGame.channel.setName(newGame.channelName);
    await originalGame.message.edit(JSON.stringify(newGame));

    Logger.log(this.CLASS_NAME, 'UPDATED GAME');
  }

  private async createGameRoleMessage(): Promise<void> {
    const botMessages = this.gameRoleChannel.messages.cache
      .array()
      .filter(message => message.author.id === message.client.user?.id && message.pinned);

    if (botMessages.length === 0) {
      this.gameRoleMessage = await this.gameRoleChannel.send(new MessageEmbed().setTitle('Game Roles Placeholder'));
      await this.gameRoleMessage.pin();

      await this.gameRoleChannel.messages.fetch();
      await Promise.all(
        this.gameRoleChannel.messages.cache
          .filter(message => message.type === 'PINS_ADD')
          .map(message => message.delete()),
      );

      Logger.log(this.CLASS_NAME, 'CREATED GAME ROLE MESSAGE IN:', config.gameRoleChannel);
    } else {
      this.gameRoleMessage = botMessages[0];
      Logger.log(this.CLASS_NAME, 'GAME ROLE MESSAGE IN', `"${config.gameRoleChannel}"`, 'ALREADY EXISTS');
    }

    if (!this.gameRoleMessage) throw Error('NO ' + config.gameRoleChannel + ' FOUND');
    await this.gameRoleMessage.fetch();

    const games = (await this.fetchGames()).sort((a, b) => a.name.localeCompare(b.name));
    await this.gameRoleMessage.edit(this.createGameRoleEmbed(games));

    const reactions = this.gameRoleMessage.reactions.cache.array().map(reaction => reaction.emoji.name);
    if (games.some(game => game.emoji && !reactions.includes(game.emoji))) {
      Logger.log(this.CLASS_NAME, 'CLEARED AND RE-ADDING ALL GAME EMOJI REACTIONS');
      await this.gameRoleMessage.reactions.removeAll();
      await Promise.all(games.map(async game => game.emoji && this.gameRoleMessage.react(game.emoji)));
    } else Logger.log(this.CLASS_NAME, 'ALL GAME REACTIONS PRESENT');

    Logger.log(this.CLASS_NAME, 'FINISHED CREATING GAME ROLE MESSAGE');
  }

  private createGameRoleEmbed(games: Game[]): MessageEmbed {
    const gamesText = games
      .filter(game => game.emoji)
      .reduce((acc, game) => {
        if (acc.length > 0) acc += '\n';
        return (acc += `${game.emoji}\u2003${game.name}`);
      }, '');
    return new MessageEmbed()
      .setColor('#2f3136')
      .setTitle('Opt-In Game Roles')
      .setDescription(
        'Self-assign game roles by using the respective emoji to toggle the role.\nRoles give you access to the respective text-channel(s).',
      )
      .addField('Games', gamesText)
      .setFooter('To request a new game or channel please contact an admin.');
  }

  private async sortChannelsAndRoles() {
    await this.sortGameChannels();
    await this.sortGameRoles();
  }

  private async sortGameChannels() {
    await this.guild.fetch();
    const channelPositions = this.guild.channels.cache
      .filter(channel => channel.parentID === this.gameCategory.id)
      .map(c => c)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c, index) => ({ channel: c.id, position: index }));
    await this.guild.setChannelPositions(channelPositions);

    Logger.log(this.CLASS_NAME, 'FINISHED SORTING CHANNELS');
  }

  private async sortGameRoles() {
    const games = await this.fetchGames();
    const gameRoleNames = games.map(g => g.roleName);
    gameRoleNames.push(config.gamesRoleName);
    const gameRoles = this.guild.roles.cache
      .filter(r => gameRoleNames.includes(r.name))
      .array()
      .sort((a, b) => b.name.localeCompare(a.name));
    const gameRolePositions = gameRoles.map(r => r.position).sort((a, b) => a - b);
    const rolePositions = gameRoles.map((role, index) => ({ role, position: gameRolePositions[index] }));
    await this.guild.setRolePositions(rolePositions);

    Logger.log(this.CLASS_NAME, 'FINISHED SORTING ROLES');
  }
}
