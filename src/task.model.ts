import { TaskDto } from './task.dto.js';

export class TaskModel {
  public id: string;
  public title: string;
  public isComplete: boolean;

  public constructor(taskDto: TaskDto) {
    const { id, title, isComplete } = taskDto;
    this.id = id;
    this.title = title;
    this.isComplete = isComplete;
  }

  public toString(): string {
    return `${this.title}\t${this.isComplete ? '(completed)' : ''}`;
  }
}
