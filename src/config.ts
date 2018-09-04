import DEBUG from 'debug';
import { EventEmitter2 } from 'eventemitter2';
import * as fs from 'fs';
import * as _ from 'lodash';

const debug = DEBUG('Config')

export interface LoadFileOption {
    prefixKey?: string
    encoding: string
}
export interface ConfigUpdateEvent {
    key: string
    value: any
}

export class Config extends EventEmitter2 {

    private config = {} as any

    constructor() {
        super({ wildcard: true })
    }

    /**
     * load config from file sync. 
     * support .json .y(a)ml .js
     *
     * @param {string} path
     * @param {Partial<LoadFileOption>} [opt]
     * @memberof Config
     */
    loadFromFile (path: string, opt?: Partial<LoadFileOption>) {
        const options = Object.assign({ encoding: 'utf8' }, opt)
        debug('load from file :', path, 'prefixKey :', options.prefixKey || '')
        const obj = this._loadFromFile(path, options)
        if (!obj) {
            return
        }
        this.merge(obj, options.prefixKey)
    }

    toJSON () {
        return this.config
    }

    /**
     * mrege values
     *
     * @param {{ [k: string]: any }} obj
     * @param {string} [prefixKey]
     * @memberof Config
     */
    merge (obj: { [k: string]: any }, prefixKey?: string): this {
        debug('merge config:', obj, 'prefixKey', prefixKey || '')
        for (let k of Object.keys(obj)) {
            if (typeof k === 'string') {
                const key = prefixKey && prefixKey.length > 0 ? `${prefixKey.replace(/\.*$/, '')}.${k}` : k
                this.set(key, obj[k])
            }
        }
        return this
    }

    set (key: string, value: any): this {
        debug('set value key:', key, 'value:', value)
        const v = _.get(this.config, key)
        if (v !== value) {
            _.set(this.config, key, value)
            this.emit('update', { key, value })
            this.emit('update:' + key, { key, value })
        }
        return this
    }
    has (key: string): boolean {
        return typeof this.get(key) !== 'undefined'
    }

    get<T=any> (key: string): T | undefined
    get<T=any> (key: string, defaultValue: T): T
    get<T=any> (key: string, defaultValue?: T): | undefined {
        debug('get value key:', key)
        const v = _.get(this.config, key)
        return v === undefined ? defaultValue : v
    }

    getAsString (key: string, defaultValue?: string) {
        const v = this.get(key, defaultValue)
        if (typeof v === 'undefined') {
            return
        }
        return v.toString()
    }

    getAsNumber (key: string, defaultValue?: number) {
        const v = this.get(key, defaultValue)
        if (typeof v === 'undefined') {
            return
        }
        return typeof v === 'number' ? v : parseFloat(v)
    }

    getAsIneger (key: string, defaultValue?: number) {
        const v = this.get(key, defaultValue)
        if (typeof v === 'undefined') {
            return
        }
        return Math.floor(v)
    }

    private _loadFromFile (path: string, opt: LoadFileOption): any {
        if (/\.ya?ml$/.test(path)) {
            const yaml = require('js-yaml');
            const content = fs.readFileSync(path).toString(opt.encoding)
            return yaml.safeLoad(content)
        } else if (/\.json$/.test(path)) {
            const content = fs.readFileSync(path).toString(opt.encoding)
            return JSON.parse(content)
        } else if (/\.js$/.test(path)) {
            const content = fs.readFileSync(path).toString(opt.encoding)
            const { NodeVM } = require('vm2');
            const vm = new NodeVM({
                sandbox: { process: { env: Object.assign({}, process.env) } },
            });
            return vm.run(content)
        } else {
            throw new Error(`can not load config, only support [.js .json .y(a)ml] file`)
        }
    }
}