import { IllegalStateException } from '../util/exceptions.js';
import { ModelMeta } from './ModelMeta.js';

function readMeta(modelClass) {
  let cursor = modelClass;
  while (cursor && cursor !== Function.prototype) {
    if (Object.hasOwn(cursor, 'META')) {
      const meta = cursor.META;
      if (!(meta instanceof ModelMeta)) {
        throw new Error('META is not a ModelMeta');
      }
      return meta;
    }
    cursor = Object.getPrototypeOf(cursor);
  }
  throw new Error('missing META');
}

export class BaseModel {
  /**
   * Java Class.getField, so a public META on a superclass is visible.
   */
  static metaOf(modelClass) {
    try {
      return readMeta(modelClass);
    } catch (cause) {
      throw new IllegalStateException(
        `Model class ${modelClass?.name ?? modelClass} must define public static final ModelMeta META`,
        { cause },
      );
    }
  }

  meta() {
    return BaseModel.metaOf(this.constructor);
  }

  metaOf() {
    return BaseModel.metaOf(this.constructor);
  }
}
