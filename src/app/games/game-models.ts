import { Message, Role, TextChannel } from 'discord.js';

export interface Game {
  id: number;
  name: string;
  color: string;
  roleName: string;
  channelName: string;
  emoji: string | null;
}

export interface GameData extends Game {
  message: Message;
  role: Role;
  channel: TextChannel;
}
