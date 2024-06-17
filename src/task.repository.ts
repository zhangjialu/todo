import { nanoid } from 'nanoid';

import { TaskDto } from './task.dto.js';
import { IDatabase } from './task.database.js';
import { TaskSchema } from './task.schema.js';

export type TaskFilter = {
  idFilter?: string | string[];
  titleFilter?: string | RegExp;
  isCompleteFilter?: boolean;
};

export class TaskRepository {
  public constructor(private db: IDatabase<TaskSchema>) {}

  public insertOne(taskInfo: Omit<TaskDto, 'id'>): TaskDto {
    const taskDtos = this.insertMany([taskInfo]);

    return taskDtos[0];
  }

  public insertMany(taskInfos: Omit<TaskDto, 'id'>[]): TaskDto[] {
    const taskDtos = taskInfos.map((taskInfo) => ({ id: nanoid(), ...taskInfo }));

    this.db.update((data) => {
      data.tasks = [...data.tasks, ...taskDtos];
    });

    return taskDtos;
  }

  public getById(id: string): TaskDto | undefined {
    return this.db.data.tasks.find((task) => task.id === id);
  }

  public getMany(filter?: TaskFilter): TaskDto[] {
    let { tasks } = this.db.data;

    if (filter) {
      const { idFilter, titleFilter, isCompleteFilter } = filter;

      if (idFilter !== undefined) {
        if (typeof idFilter === 'string') {
          tasks = tasks.filter((task) => task.id === idFilter);
        } else {
          tasks = tasks.filter((task) => idFilter.includes(task.id));
        }
      }

      if (titleFilter !== undefined) {
        if (typeof titleFilter === 'string') {
          tasks = tasks.filter((task) => task.title.includes(titleFilter));
        } else {
          tasks = tasks.filter((task) => titleFilter.test(task.title));
        }
      }

      if (isCompleteFilter !== undefined) {
        tasks = tasks.filter((task) => task.isComplete === isCompleteFilter);
      }
    }

    return tasks;
  }

  private update(taskIds: string[], partial: Partial<Omit<TaskDto, 'id'>>): void {
    const { title, isComplete } = partial;

    if (title !== undefined || isComplete !== undefined) {
      this.db.update((data) => {
        data.tasks.map((task) => {
          if (taskIds.includes(task.id)) {
            if (title !== undefined) {
              task.title = title;
            }

            if (isComplete !== undefined) {
              task.isComplete = isComplete;
            }
          }

          return task;
        });
      });
    }
  }

  public updateById(id: string, partial: Partial<Omit<TaskDto, 'id'>>): void {
    this.update([id], partial);
  }

  public updateMany(filter: TaskFilter, partial: Partial<Omit<TaskDto, 'id'>>): void {
    const taskIdsWillBeUpdated = this.getMany(filter).map((task) => task.id);
    this.update(taskIdsWillBeUpdated, partial);
  }

  private remove(ids: string[]): void {
    this.db.update((data) => {
      data.tasks = data.tasks.filter((task) => !ids.includes(task.id));
    });
  }

  public removeById(id: string): void {
    this.remove([id]);
  }

  public removeMany(filter: TaskFilter): void {
    const taskIdsWillBeRemoved = this.getMany(filter).map((task) => task.id);
    this.remove(taskIdsWillBeRemoved);
  }
}
