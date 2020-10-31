import { Guild, IConfig } from './config.interface';
import { TOKEN } from './token.hidden';

export const config: IConfig = {
  botChannel: 'botspam',
  botName: 'BAMBot',

  botCategory: 'bot-channels',
  gameCategory: 'games',
  gameRoleChannel: 'information',
  gameDataChannel: 'game-data',
  gameRoleName: '— — — — — Games — — — — —',

  token: TOKEN,

  guild: Guild.BAMBots,
};
