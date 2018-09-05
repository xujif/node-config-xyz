import 'mocha';

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { Config, ConfigUpdateEvent } from '../config';

describe('Test Config', () => {
    it('simple', () => {
        const config = new Config()
        config.set('xxx', 1)
        assert.strictEqual(1, config.get('xxx'))
        assert.strictEqual(1, config.get('not exist and return default', 1))
    })
    it('merge', () => {
        const config = new Config()
        config.set('xxx', 2)
        assert.strictEqual(2, config.get('xxx'))
        config.merge({ 'xxx': 1 })
        config.merge({ 'yyy': 1 }, 'prefix')
        assert.strictEqual(1, config.get('xxx'))
        assert.strictEqual(1, config.get('prefix.yyy'))
    })
    it('get with typecast', () => {
        const config = new Config()
        config.set('xxx', 1.2)
        assert.strictEqual('1.2', config.getAsString('xxx'))
        assert.strictEqual(1.2, config.getAsNumber('xxx'))
        assert.strictEqual(1, config.getAsIneger('xxx'))
    })
    it('dot prop', () => {
        const config = new Config()
        config.set('xxx.aaa', 1)
        assert.strictEqual(1, config.get('xxx.aaa'))
        assert.strictEqual(1, config.get('xxx').aaa)
        config.set('yyy', { aaa: 2 })
        assert.strictEqual(2, config.get('yyy.aaa'))
        assert.strictEqual(2, config.get('yyy').aaa)
    })
    it('event', (done) => {
        const config = new Config()
        config.on('update', (e: ConfigUpdateEvent) => {
            assert.strictEqual('xxx.aa', e.key)
            assert.strictEqual(1, e.value)
            done()
        })
        config.set('xxx.aa', 1)
    })
    it('wild event', (done) => {
        const config = new Config()
        config.on('update:xxx.**', (e: ConfigUpdateEvent) => {
            assert.strictEqual('xxx.aa', e.key)
            assert.strictEqual(1, e.value)
            done()
        })
        config.set('xxx.aa', 1)
    })
    it('load json file', () => {
        const config = new Config()
        const cfg = {
            xxx: { aaa: 1 }
        }
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.json`)
        try {
            fs.writeFileSync(tmpfile, JSON.stringify(cfg), 'utf8')
            config.loadFromFile(tmpfile)
            assert.strictEqual(1, config.get('xxx.aaa'))
            // with prefixKey
            config.loadFromFile(tmpfile, { prefixKey: 'test' })
            assert.strictEqual(1, config.get('test.xxx.aaa'))
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })
    it('load yml file', () => {
        const config = new Config()
        const cfg = `xxx:\n  aaa: 1`
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.yml`)
        try {
            fs.writeFileSync(tmpfile, cfg, 'utf8')
            config.loadFromFile(tmpfile)
            assert.strictEqual(1, config.get('xxx.aaa'))
            // with prefixKey
            config.loadFromFile(tmpfile, { prefixKey: 'test' })
            assert.strictEqual(1, config.get('test.xxx.aaa'))
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })



    it('load js file', () => {
        const config = new Config()
        const cfg = `module.exports = {xxx:{aaa:1}}`
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.js`)
        try {
            fs.writeFileSync(tmpfile, cfg, 'utf8')
            config.loadFromFile(tmpfile)
            assert.strictEqual(1, config.get('xxx.aaa'))
            // with prefixKey
            config.loadFromFile(tmpfile, { prefixKey: 'test' })
            assert.strictEqual(1, config.get('test.xxx.aaa'))
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })

    it('load js file unsafe', (done) => {
        const config = new Config()
        const cfg = `const os = require('os'); module.exports = {xxx: os.cpus().length}`
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.js`)
        try {
            fs.writeFileSync(tmpfile, cfg, 'utf8')
            config.loadFromFile(tmpfile)
            assert(false, 'shoud raise exception cannot access here')
        } catch{
            done()
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })

    it('load js file not in vm', () => {
        const config = new Config()
        const cfg = `const os = require('os'); module.exports = {xxx: os.cpus().length}`
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.js`)
        try {
            fs.writeFileSync(tmpfile, cfg, 'utf8')
            config.loadFromFile(tmpfile, { loadJsFileWithVm: false })
            assert.strictEqual(require('os').cpus().length, config.get('xxx'))
        } catch{
            assert(false, 'cannot access here')
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })

    it('reload js file (test ignore require cache)', () => {
        const config = new Config()
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.js`)
        try {
            fs.writeFileSync(tmpfile, `module.exports = {xxx: 1}`, 'utf8')
            config.loadFromFile(tmpfile, { loadJsFileWithVm: false })
            assert.strictEqual(1, config.get('xxx'))
            fs.writeFileSync(tmpfile, `module.exports = {xxx: 2}`, 'utf8')
            config.loadFromFile(tmpfile, { loadJsFileWithVm: false })
            assert.strictEqual(2, config.get('xxx'))
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })


    it('load js file with procees.env', () => {
        const config = new Config()
        process.env.xxx = '111'
        const cfg = `module.exports = {xxx:process.env.xxx}`
        const tmpfile = path.join(os.tmpdir(), `/can_delete_${Math.floor(Math.random() * 10000)}.js`)
        try {
            fs.writeFileSync(tmpfile, cfg, 'utf8')
            config.loadFromFile(tmpfile)
            assert.strictEqual('111', config.get('xxx'))
        } finally {
            if (fs.existsSync(tmpfile)) {
                fs.unlinkSync(tmpfile)
            }
        }
    })

});



