import { TaskModel } from './task.model.js';
import { TaskFilter, TaskRepository } from './task.repository.js';

export type TaskStats = {
  total: number;
  completed: number;
  incomplete: number;
};

export class TaskService {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public add(title: string): TaskModel {
    return new TaskModel(this.taskRepository.insertOne({ title, isComplete: false }));
  }

  public getById(id: string): TaskModel | undefined {
    const task = this.taskRepository.getById(id);
    if (task) {
      return new TaskModel(task);
    } else {
      return undefined;
    }
  }

  public search(filter?: TaskFilter): TaskModel[] {
    return this.taskRepository.getMany(filter).map((taskDto) => new TaskModel(taskDto));
  }

  public markAsComplete(id: string): void {
    this.taskRepository.updateById(id, { isComplete: true });
  }

  public markAsIncomplete(id: string): void {
    this.taskRepository.updateById(id, { isComplete: false });
  }

  public removeComplete(): void {
    this.taskRepository.removeMany({ isCompleteFilter: true });
  }

  public getStats(): TaskStats {
    const total = this.search().length;
    const completed = this.search({ isCompleteFilter: true }).length;
    const incomplete = total - completed;

    return {
      total,
      completed,
      incomplete,
    };
  }
}
