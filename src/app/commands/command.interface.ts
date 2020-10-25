
export interface Command {

  execute<T>(): Promise<T> | T;

}
