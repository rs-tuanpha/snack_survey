type IndexType = {
    [key: string]: any;
  };
export const mappingObject = (obj1: IndexType, obj2: IndexType): IndexType => {
    const result: IndexType = {};
    for (const key in obj1) {
      if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
        obj1[key] = obj2[key];
      }
    }
    return result;
}