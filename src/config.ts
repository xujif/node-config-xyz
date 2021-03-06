import DEBUG from 'debug';
import { EventEmitter2 } from 'eventemitter2';
import * as _ from 'dot-prop';
import { isUndefined, isNullOrUndefined } from 'util';

const debug = DEBUG("config-xyz")

export interface LoadFileOption {
  prefixKey?: string
  encoding: string
  loadJsFileWithVm?: boolean
}
export interface ConfigUpdateEvent {
  key: string
  value: any
}

export class Config {

  private config = {} as any
  protected _events?: EventEmitter2

  public get events () {
    if (!this._events) {
      this._events = new EventEmitter2({ wildcard: true })
    }
    return this._events
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
    const options = Object.assign({ encoding: 'utf8', loadJsFileWithVm: true }, opt)
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
      if (typeof (k as any) === 'string') {
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
      if (this._events) {
        this._events.emit('update', { key, value })
        this._events.emit('update:' + key, { key, value })
      }
    }
    return this
  }

  has (key: string): boolean {
    return isUndefined(this.get(key))
  }

  get<T = any> (key: string): T | undefined
  get<T = any> (key: string, defaultValue: T): T
  get<T = any> (key: string, defaultValue?: T): T | undefined {
    debug('get value key:', key)
    return _.get(this.config, key, defaultValue)
  }

  getAsString (key: string, defaultValue?: string) {
    const v = this.get(key, defaultValue)
    return isNullOrUndefined(v) ? defaultValue : v.toString()
  }

  getAsNumber (key: string, defaultValue?: number) {
    const v = this.get(key, defaultValue)
    return isNullOrUndefined(v) ? defaultValue : parseFloat(v as any)
  }

  getAsIneger (key: string, defaultValue?: number) {
    const v = this.get(key, defaultValue)
    return isNullOrUndefined(v) ? defaultValue : Math.floor(v)
  }

  private _loadFromFile (path: string, opt: LoadFileOption): any {
    if (/\.ya?ml$/.test(path)) {
      const yaml = require('js-yaml');
      const content = require("fs").readFileSync(path).toString(opt.encoding)
      return yaml.safeLoad(content)
    } else if (/\.json$/.test(path)) {
      const content = require("fs").readFileSync(path).toString(opt.encoding)
      return JSON.parse(content)
    } else if (/\.js$/.test(path)) {
      if (opt.loadJsFileWithVm) {
        const content = require("fs").readFileSync(path).toString(opt.encoding)
        const { NodeVM } = require('vm2');
        const vm = new NodeVM({
          sandbox: { process: { env: Object.assign({}, process.env) } },
        });
        return vm.run(content)
      } else {
        const Module = require('module');
        delete require.cache[Module._resolveFilename(path, module)];
        return module.require(path);
      }
    } else {
      throw new Error(`can not load config, only support [.js .json .y(a)ml] file`)
    }
  }
}
