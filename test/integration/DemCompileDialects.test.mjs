import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';
import Container from '@teqfw/di';

const root = path.resolve(import.meta.dirname, '../..');

function container() {
    const result = new Container();
    result.addNamespaceRoot('TeqFw_Db_', path.join(root, 'node_modules/@teqfw/db/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Cfg_', path.join(root, 'node_modules/@teqfw/cfg/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Log_', path.join(root, 'node_modules/@teqfw/log/src'), '.mjs');
    return result;
}

describe('State DEM compilation', () => {
    it('has no diagnostics for every supported relational dialect', async () => {
        const di = container();
        const compile = await di.get('TeqFw_Db_Back_Dem_Compile$');
        const declaration = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
        const mapEnvelope = {declaration: {version: 2, namespace: '', ref: {}, deprecated: {}}, filename: 'test://map', mapId: 'map', packageName: '@flancer32/alarisa'};

        for (const name of ['Sqlite', 'Postgresql', 'Mysql']) {
            const adapter = await di.get(`TeqFw_Db_Back_RDb_Dialect_${name}$`);
            const compilation = await compile.exec({
                adapter,
                fragments: [{declaration, filename: path.join(root, 'etc/teqfw.schema.json'), fragmentId: '@flancer32/alarisa-back-state', packageName: '@flancer32/alarisa-back-state'}],
                mapEnvelope,
            });
            compile.assertResult({value: compilation});
            assert.equal(compilation.warnings.length, 0, name);
            assert.equal(compilation.physical.tables.length, 10, name);
        }
    });
});
