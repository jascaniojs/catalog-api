import { Id } from './value-objects/id.vo';

export abstract class AggregateRoot {
  protected readonly _id: Id;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id?: Id) {
    this._id = id || Id.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): Id {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(other: AggregateRoot): boolean {
    return this._id.equals(other._id);
  }
}