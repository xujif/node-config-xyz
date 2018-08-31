# config-xyz
A configuration manager for NodeJS. support nodejs & typescript  
- support dot prop set/get 
- support update event 
- support load config from .js|yml|json file

## install
```
npm install config-xyz --save
// yarn add config-xyz
```
## Usage
more examples are in src/tests/test_config.ts
```typescript
import { ConfigUpdateEvent, Config } from 'config-xyz';

const config = new Config()
config.set('xxx', 1)
config.merge({ 'yyy': 1 })

assert.strictEqual(1, config.get('xxx'))
assert.strictEqual(1, config.get('not exist and return default', 1))
config.set('xxx.aaa', 1)
assert.strictEqual(1, config.get('xxx.aaa'))
assert.strictEqual(1, config.get('xxx').aaa)

// Event
config.on('update', (e: ConfigUpdateEvent) => {
    assert.strictEqual('xxx.aa', e.key)
    assert.strictEqual(1, e.value)
})
// wild Event powered by Eventemitter2
config.on('update:xxx.**', (e: ConfigUpdateEvent) => {
    assert.strictEqual('xxx.aa', e.key)
    assert.strictEqual(1, e.value)
})
config.set('xxx.aa', 1)

```

## API
```typescript
export class Config extends EventEmitter2 {
    /**
     * load config from file sync. 
     * support .json .y(a)ml .js
     *
     * @param {string} path
     * @param {Partial<LoadFileOption>} [opt]
     * @memberof Config
     */
    loadFromFile (path: string, opt?: Partial<LoadFileOption>) : this
    /**
     * mrege values
     *
     * @param {{ [k: string]: any }} obj
     * @param {string} [namespace]
     * @memberof Config
     */
    merge (obj: { [k: string]: any }, namespace?: string) : this
    set (key: string, value: any): this 
    has (key: string): boolean 
    get<T=any> (key: string, defaultValue?: T): T 
    getAsString (key: string, defaultValue?: string) : string
    getAsNumber (key: string, defaultValue?: number) : number
    getAsIneger (key: string, defaultValue?: number) : number
}


```