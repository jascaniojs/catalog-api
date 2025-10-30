import { v4 as uuidv4 } from 'uuid';

export class Id {
  private readonly _value: string;

  constructor(value?: string) {
    this._value = value || uuidv4();
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  private validate(): void {
    if (!this._value || this._value.trim().length === 0) {
      throw new Error('Id cannot be empty');
    }
  }

  equals(other: Id): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value?: string): Id {
    return new Id(value);
  }
}