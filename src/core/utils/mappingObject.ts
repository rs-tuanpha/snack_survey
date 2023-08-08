type IndexType = {
    [key: string]: any;
  };
export const mappingObject = (obj1: IndexType, obj2: IndexType): void => {
    for (const key in obj1) {
      if (Object.prototype.hasOwnProperty.call(obj1, key) && Object.prototype.hasOwnProperty.call(obj2, key)) {
        obj1[key] = obj2[key];
      }
    }
}