import { Guild, IConfig } from './config.interface';
import { TOKEN } from './token.hidden';

export const config: IConfig = {
  botChannel: 'botspam',

  botCategory: 'bot-channels',
  gameCategory: 'games',
  gameRoleChannel: 'readme',
  gameDataChannel: 'game-data',
  gamesRoleName: '· · · · · · · · · · · · · · · Games · · · · · · · · · · · · · · ·',

  token: TOKEN,

  guild: Guild.BAM_Jonge,
};
