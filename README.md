# openapi2bruno

Generate bruno (`.bru`) file from OpenAPI definition. (`.json`, `.yaml`)

## Getting Started

```
git clone git@github.com:mr04vv/openapi2bruno.git
npm i
npm run sample
```

## Usage
```
npx openapi2bruno -i=config.js
```

## CLI Option

`-i`, `--input`
path to an config file for input

## Config

```sample.config.js
module.exports = [
    {
        input: './sample/open_api.json',
        output: "./sample"
    },
    {
        input: './sample/open_api.yaml',
        output: "./sample"
    },
  ];
```

- input: OpenAPI file path
- output: Output directory (must be existed)