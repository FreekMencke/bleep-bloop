import { Logger } from '../common/logger';
import { Command } from './command.interface';

export class ErrorCommand implements Command {
  readonly CLASS_NAME: string = 'ERROR_COMMAND';

  private errorMessages: string[];

  constructor(
    ...errorMessages: string[]
  ) {
    this.errorMessages= errorMessages;
  }

  execute(): any {
    Logger.log(this.CLASS_NAME + ':', ...this.errorMessages);
  }

}
