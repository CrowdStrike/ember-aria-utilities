/* eslint-disable no-console */
import * as faker from 'faker';

let sampleColumns = 4;
let sampleRows = 60;

const timeKey = 'Generating sample data';

export function generateSampleData(rows = sampleRows, columns = sampleColumns) {
  console.time(timeKey);

  let generators = [];

  for (let i = 0; i < columns; i++) {
    let info = getRandomMethod();

    // we want 0 arity
    while (!info.method || typeof info.method !== 'function' || info.method.length > 0) {
      info = getRandomMethod();
    }

    generators.push([info.name, info.method]);
  }

  let result = Array.from({ length: rows }, () => {
    return generators.map(([, generator]) => generator());
  });

  console.timeEnd(timeKey);

  return {
    headers: generators.map(([name]) => name),
    rows: result,
  };
}

function getRandomMethod() {
  let sections = Object.keys(faker);

  let section = faker.random.arrayElement(sections);

  let methods = Object.keys(faker[section]);

  let method = faker.random.arrayElement(methods);

  return { name: `${section}.${method}`, method: faker[section][method] };
}
