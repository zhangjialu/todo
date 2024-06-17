import { PathLike } from 'node:fs';
import { homedir } from 'node:os';
import { TaskRepository } from './task.repository.js';
import { TaskService } from './task.service.js';
import { checkbox, input, select } from '@inquirer/prompts';
import { resolve } from 'node:path';
import { TaskDatabase } from './task.database.js';
import { TaskDto } from './task.dto.js';
import { TaskSchema } from './task.schema.js';

export type AppState = {
  showCompleted: boolean;
};

export const initialState: AppState = {
  showCompleted: true,
};

export type AppOptions = {
  state: AppState;
  storageLocation: PathLike;
  defaultData: TaskSchema;
};

export const defaultOptions: AppOptions = {
  state: initialState,
  storageLocation: resolve(homedir(), 'tasks.json'),
  defaultData: { tasks: [] },
};

export const enum Commands {
  Toggle = 'Toggle',
  Add = 'Add',
  Complete = 'Complete',
  Purge = 'Purge',
  Quit = 'Quit',
}

export class Application {
  private state: AppState;
  private taskService: TaskService;

  public constructor(options?: Partial<AppOptions>) {
    // TODO: 只能覆盖第一层属性，嵌套对象的属性覆盖有问题
    const { state, storageLocation, defaultData } = { ...defaultOptions, ...options };

    this.state = state;
    this.taskService = new TaskService(new TaskRepository(new TaskDatabase(storageLocation, defaultData)));
  }

  public start() {
    this.showPrompt();
  }

  private displayTasks(): void {
    const { total, completed, incomplete } = this.taskService.getStats();
    console.log(`Todo Lists (total: ${total}, incomplete: ${incomplete}, completed: ${completed}) `);
    this.taskService
      .search(this.state.showCompleted ? undefined : { isCompleteFilter: false })
      .forEach((todo) => console.log(`${todo}`));
  }

  private async promptAdd(): Promise<void> {
    console.clear();

    const task = await input({ message: 'Enter task: ' });
    this.taskService.add(task);
  }

  private async promptComplete(): Promise<void> {
    console.clear();

    const allTasks = this.taskService.search();

    const selectedIds = await checkbox({
      message: 'Mark Task Complete',
      choices: allTasks.map((task) => ({ name: task.title, value: task.id, checked: task.isComplete })),
    });

    selectedIds.forEach((id) => {
      this.taskService.markAsComplete(id);
    });

    allTasks.forEach(({ id }) => {
      if (!selectedIds.includes(id)) {
        this.taskService.markAsIncomplete(id);
      }
    });
  }

  private async hansleToggleCommand(): Promise<void> {
    this.state.showCompleted = !this.state.showCompleted;
    await this.showPrompt();
  }

  private async handleAddCommand(): Promise<void> {
    await this.promptAdd();
    await this.showPrompt();
  }

  private async handleCompleteCommand(): Promise<void> {
    await this.promptComplete();
    await this.showPrompt();
  }

  private async handlePurgeCommand(): Promise<void> {
    this.taskService.removeComplete();
    await this.showPrompt();
  }

  private async showPrompt(): Promise<void> {
    console.clear();
    this.displayTasks();

    const option = await select({
      message: 'Choose Option',
      choices: [
        {
          name: 'Show/Hide Completed',
          value: Commands.Toggle,
          description: 'Show or hide completed todo items',
          disabled: this.taskService.search().every((task) => task.isComplete === false),
        },
        {
          name: 'Add Task',
          value: Commands.Add,
          description: 'Add a new todo item',
        },
        {
          name: 'Complete Task',
          value: Commands.Complete,
          description: 'Mark a todo item as completed',
        },
        {
          name: 'Remove Completed Task',
          value: Commands.Purge,
          description: 'Remove completed todo item',
          disabled: this.taskService.search().every((task) => task.isComplete === false),
        },
        {
          name: 'Quit',
          value: Commands.Quit,
          description: 'Quit application',
        },
      ],
    });

    switch (option) {
      case Commands.Toggle:
        this.hansleToggleCommand();
        break;
      case Commands.Add:
        this.handleAddCommand();
        break;
      case Commands.Complete:
        this.handleCompleteCommand();
        break;
      case Commands.Purge:
        this.handlePurgeCommand();
        break;
      case Commands.Quit:
        break;
      default:
        throw new Error('invalid command');
    }
  }
}
