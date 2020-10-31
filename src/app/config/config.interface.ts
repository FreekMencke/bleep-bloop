export interface IConfig {
  botChannel: string;

  botCategory: string;
  gameCategory: string;
  gameRoleChannel: string;
  gameDataChannel: string;
  gameRoleName: string;

  token: string;

  guild: string;
}

export enum Guild {
  BAMBots = '769611691687411713',
  BAM_Jonge = '319680848578215938',
}