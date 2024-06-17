import { before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { IDatabase } from './task.database.js';
import { TaskSchema } from './task.schema.js';
import { TaskRepository } from './task.repository.js';

class TaskDatabaseMock implements IDatabase<TaskSchema> {
  public data: TaskSchema;

  public constructor(defaultData: TaskSchema = { tasks: [] }) {
    this.data = defaultData;
  }

  public update(fn: (data: TaskSchema) => unknown) {
    fn(this.data);
  }
}

describe('TaskRepository', () => {
  let taskDatabase: TaskDatabaseMock;
  let taskRepository: TaskRepository;

  beforeEach(() => {
    taskDatabase = new TaskDatabaseMock();
    taskRepository = new TaskRepository(taskDatabase);
  });

  describe('#insertOne()', () => {
    it('应正确返回被插入的数据', () => {
      const task = { title: '打扫房间', isComplete: false };

      const taskDto = taskRepository.insertOne(task);

      assert.equal(typeof taskDto.id, 'string');
      assert.equal(taskDto.title, task.title);
      assert.equal(taskDto.isComplete, task.isComplete);
    });

    it('应正确插入一条数据', () => {
      const task1 = { title: '打扫房间', isComplete: false };
      const task2 = { title: '买菜', isComplete: true };

      const task1Dto = taskRepository.insertOne(task1);
      const task2Dto = taskRepository.insertOne(task2);

      assert.deepEqual(taskDatabase.data.tasks, [task1Dto, task2Dto]);
    });
  });

  describe('#insertMany()', () => {
    it('应正确返回被插入的数据', () => {
      const tasks = [
        { title: '打扫房间', isComplete: false },
        { title: '买菜', isComplete: true },
      ];

      const taskDtos = taskRepository.insertMany(tasks);

      assert.equal(typeof taskDtos[0].id, 'string');
      assert.equal(taskDtos[0].title, tasks[0].title);
      assert.equal(taskDtos[0].isComplete, tasks[0].isComplete);
      assert.equal(typeof taskDtos[1].id, 'string');
      assert.equal(taskDtos[1].title, tasks[1].title);
      assert.equal(taskDtos[1].isComplete, tasks[1].isComplete);
    });

    it('应正确插入多条数据', () => {
      const tasks = [
        { title: '打扫房间', isComplete: false },
        { title: '买菜', isComplete: true },
      ];

      const taskDtos = taskRepository.insertMany(tasks);

      assert.deepEqual(taskDatabase.data.tasks, taskDtos);
    });
  });

  describe('#getById()', () => {
    it('应正确返回给定id对应的数据库记录', () => {
      const task1Dto = taskRepository.insertOne({ title: '打扫房间', isComplete: false });
      const task = taskRepository.getById(task1Dto.id);

      assert.deepEqual(task, task1Dto);
    });
    it('若给定id对应的数据库记录不存在，返回undefined', () => {
      const task = taskRepository.getById('');

      assert.deepEqual(task, undefined);
    });
  });

  describe('#getMany()', () => {
    beforeEach(() => {
      const tasks = [
        { title: '打扫房间', isComplete: false },
        { title: '买菜', isComplete: false },
        { title: '买水', isComplete: true },
        { title: '洗衣服', isComplete: true },
        { title: '洗碗', isComplete: true },
      ];
      taskRepository.insertMany(tasks);
    });

    it('若未给定参数filter，应返回所有数据库记录', () => {
      const records = taskRepository.getMany();

      assert.deepEqual(records, taskDatabase.data.tasks);
    });

    it('idFilter', () => {
      const { tasks } = taskDatabase.data;

      // 指定 idFilter 为单个 id 时
      const records1 = taskRepository.getMany({ idFilter: tasks[0].id });
      assert.equal(records1.length, 1);
      assert.deepEqual(records1[0], tasks[0]);

      // 指定指定 idFilter 为 id 数组时
      const records2 = taskRepository.getMany({ idFilter: [tasks[0].id, tasks[1].id] });
      assert.equal(records2.length, 2);
      assert.deepEqual(records2[0], tasks[0]);
      assert.deepEqual(records2[1], tasks[1]);
    });

    it('titleFilter', () => {
      const { tasks } = taskDatabase.data;
      // 指定 titleFilter 为字符串时，返回所有 title 包含该字符串的数据库记录
      const records1 = taskRepository.getMany({ titleFilter: '打扫' });
      assert.equal(records1.length, 1);
      assert.deepEqual(records1[0], tasks[0]);

      const records2 = taskRepository.getMany({ titleFilter: '买' });
      assert.equal(records2.length, 2);
      assert.deepEqual(records2[0], tasks[1]);
      assert.deepEqual(records2[1], tasks[2]);

      // 指定 titleFilter 为正则时，返回所有 title 匹配该正则的数据库记录
      const records3 = taskRepository.getMany({ titleFilter: /洗/ });
      assert.equal(records3.length, 2);
      assert.deepEqual(records3[0], tasks[3]);
      assert.deepEqual(records3[1], tasks[4]);
    });

    it('isCompleteFilter', () => {
      const { tasks } = taskDatabase.data;

      const records1 = taskRepository.getMany({ isCompleteFilter: true });
      assert.equal(records1.length, 3);
      assert.deepEqual(records1[0], tasks[2]);
      assert.deepEqual(records1[1], tasks[3]);
      assert.deepEqual(records1[2], tasks[4]);

      const records2 = taskRepository.getMany({ isCompleteFilter: false });
      assert.equal(records2.length, 2);
      assert.deepEqual(records2[0], tasks[0]);
      assert.deepEqual(records2[1], tasks[1]);
    });

    it('mix', () => {
      const { tasks } = taskDatabase.data;

      const records1 = taskRepository.getMany({ titleFilter: '买', isCompleteFilter: true });
      assert.equal(records1.length, 1);
      assert.deepEqual(records1[0], tasks[2]);
    });
  });

  describe('#updateById()', () => {
    it('应正确更新', () => {
      const task1 = { title: '打扫房间', isComplete: false };
      const task2 = { title: '买水', isComplete: true };
      const taskDto1 = taskRepository.insertOne(task1);
      const taskDto2 = taskRepository.insertOne(task2);

      taskRepository.updateById(taskDto1.id, { title: '打扫卧室' });
      taskRepository.updateById(taskDto2.id, { isComplete: false });

      const { tasks } = taskDatabase.data;
      assert.equal(tasks[0].title, '打扫卧室');
      assert.equal(tasks[1].isComplete, false);
    });

    it('若id对应的数据库记录不存在，则什么都不做', () => {
      const task1 = { title: '打扫房间', isComplete: false };
      const task2 = { title: '买水', isComplete: true };
      taskRepository.insertMany([task1, task2]);
      const tasksCopy = taskDatabase.data.tasks;
      taskRepository.updateById('Non-existent id', { title: '没有效果的更新' });
      assert.deepEqual(taskDatabase.data.tasks, tasksCopy);
    });
  });

  describe('#updateMany()', () => {
    it('应正确更新', () => {
      const tasks = [
        { title: '打扫房间', isComplete: false },
        { title: '买菜', isComplete: false },
        { title: '买水', isComplete: true },
        { title: '洗衣服', isComplete: true },
        { title: '洗碗', isComplete: true },
      ];
      taskRepository.insertMany(tasks);

      taskRepository.updateMany({ isCompleteFilter: false }, { isComplete: true });

      assert.equal(
        taskRepository.getMany().every((task) => task.isComplete === true),
        true,
      );
    });
  });

  describe('#removeById()', () => {
    it('应正确删除', () => {
      const task1 = { title: '打扫房间', isComplete: false };
      const task2 = { title: '买水', isComplete: true };
      const taskDto1 = taskRepository.insertOne(task1);
      const taskDto2 = taskRepository.insertOne(task2);

      taskRepository.removeById(taskDto1.id);
      assert.equal(taskDatabase.data.tasks.length, 1);
      assert.equal(taskDatabase.data.tasks[0], taskDto2);
      taskRepository.removeById(taskDto2.id);
      assert.equal(taskDatabase.data.tasks.length, 0);
    });
  });

  describe('#removeMany()', () => {
    it('应正确删除', () => {
      const tasks = [
        { title: '打扫房间', isComplete: false },
        { title: '买菜', isComplete: false },
        { title: '买水', isComplete: true },
        { title: '洗衣服', isComplete: true },
        { title: '洗碗', isComplete: true },
      ];
      taskRepository.insertMany(tasks);

      taskRepository.removeMany({ isCompleteFilter: true });
      assert.equal(taskDatabase.data.tasks.length, 2);
      taskRepository.removeMany({ isCompleteFilter: false });
      assert.equal(taskDatabase.data.tasks.length, 0);
    });
  });
});
