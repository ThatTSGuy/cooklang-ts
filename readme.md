# Cooklang-TS

Cooklang-TS is a TypeScript library for parsing and manipulating [Cooklang](https://cooklang.org/) recipes.

### To-Do
- [x] Pass all tests
- [ ] Add recipe scaling support
- [ ] Add recipe tags support
- [ ] Add extension support
- [ ] Markdown extension

## Usage
```typescript
import { Recipe, parse, getImageURL } from 'cooklang-ts';

const source = `
>> source: https://www.dinneratthezoo.com/wprm_print/6796
>> total time: 6 minutes
>> servings: 2

Place the @apple juice{1,5%cups}, @banana{one sliced}, @frozen mixed berries{1,5%cups} and @vanilla greek yogurt{3/4%cup} in a #blender{}; blend until smooth. If the smoothie seems too thick, add a little more liquid (1/4 cup). 

Taste and add @honey{} if desired. Pour into two glasses and garnish with fresh berries and mint sprigs if desired.
`;

const recipe = new Recipe(source);

console.log(parse(source).metadata);
// {
//     source: 'https://www.dinneratthezoo.com/wprm_print/6796',
//     'total time': '6 minutes',
//     servings: '2',
// }

console.log(getImageURL('Mixed Berry Smoothie', {
    step: 1,
    extension: 'png'
}));
// 'Mixed Berry Smoothie.1.png'
```

## Documentation

Documentation can be found [here](https://theonlygoodone.github.io/cooklang-ts/) along with the [Cooklang Specification](https://cooklang.org/docs/spec/).

## Testing

Tests are as found in https://github.com/cooklang/spec/blob/main/tests/canonical.yaml.
```
npm test
```