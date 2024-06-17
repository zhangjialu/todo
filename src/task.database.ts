import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { PathLike } from 'node:fs';

export interface IDatabase<T> {
  data: T;
  update(fn: (data: T) => unknown): void;
}

export class TaskDatabase<T> implements IDatabase<T> {
  private db: LowSync<T>;

  public constructor(filename: PathLike, defaultData: T) {
    this.db = new LowSync<T>(new JSONFileSync(filename), defaultData);
    this.db.read();
  }

  public get data() {
    return this.db.data;
  }

  public update(fn: (data: T) => unknown): void {
    this.db.update(fn);
  }
}
