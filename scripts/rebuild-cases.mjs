import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import Container from '@teqfw/di';

const root = process.cwd();
const env = Object.fromEntries((await fs.readFile(path.join(root, '.env'), 'utf8')).split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
const cases = JSON.parse(execFileSync('ruby', ['-ryaml', '-rjson', '-e', 'puts YAML.load_file(ARGV[0]).to_json', '/home/alex/work/flancer32/alarisa/tmp/cases.yaml'], {encoding: 'utf8'})).cases;
const byCode = new Map(cases.map((item, index) => [item.id, {...item, objectId: index + 1}]));
const relationCodes = [...new Set(cases.flatMap((item) => (item.links ?? []).map((link) => link.relation)).concat('case-parent'))];
const oldTables = ['action_data', 'assertion', 'assertion_object_support', 'assertion_relation_support', 'case_data', 'entity_data', 'event_data', 'goal_data', 'interpretation', 'interpretation_observation', 'object', 'object_extension', 'obligation_data', 'observation', 'relation', 'relation_type'];

const di = new Container();
for (const [prefix, directory] of [['TeqFw_Db_', 'node_modules/@teqfw/db/src'], ['TeqFw_Cfg_', 'node_modules/@teqfw/cfg/src'], ['TeqFw_Log_', 'node_modules/@teqfw/log/src']]) di.addNamespaceRoot(prefix, path.join(root, directory), '.mjs');
const compile = await di.get('TeqFw_Db_Back_Dem_Compile$');
const planner = await di.get('TeqFw_Db_Back_RDb_Schema_A_Plan$');
const builder = await di.get('TeqFw_Db_Back_RDb_Schema_A_Builder$');
const declaration = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
const connection = await di.get('TeqFw_Db_Back_RDb_Connect$');

for (const name of ['PG', 'MARIADB']) {
    await connection.init({client: env[`TEQFW_DB__${name}_CLIENT`], connection: {host: env[`TEQFW_DB__${name}_HOST`], user: env[`TEQFW_DB__${name}_USER`], password: env[`TEQFW_DB__${name}_PASSWORD`], database: env[`TEQFW_DB__${name}_DATABASE` ]}});
    const knex = connection.getClient();
    const current = ['change_set', 'change_set_mutation', 'component', 'component_type', 'object', 'object_extension', 'property', 'property_type', 'relation', 'relation_type'];
    if (name === 'PG') for (const table of [...oldTables, ...current].map((table) => `alarisa_${table}`)) await knex.raw('DROP TABLE IF EXISTS ?? CASCADE', [table]);
    else { await knex.raw('SET FOREIGN_KEY_CHECKS = 0'); for (const table of [...oldTables, ...current].map((item) => `alarisa_${item}`)) await knex.schema.dropTableIfExists(table); await knex.raw('SET FOREIGN_KEY_CHECKS = 1'); }
    const adapter = connection.getDialectAdapter();
    const compilation = await compile.exec({adapter, fragments: [{declaration, filename: path.join(root, 'etc/teqfw.schema.json'), fragmentId: '@flancer32/alarisa-back-state', packageName: '@flancer32/alarisa-back-state'}], mapEnvelope: {declaration: {version: 2, namespace: 'alarisa', ref: {}, deprecated: {}}, filename: 'test://map', mapId: 'map', packageName: '@flancer32/alarisa'}});
    compile.assertResult({value: compilation});
    const schema = await builder.exec({adapter, connection, plan: planner.exec({compilation, operation: 'create'})});
    await knex.transaction(async (trx) => {
        await trx('alarisa_component_type').insert({id: 1, code: 'case', description: 'Central activity Component for one distinct matter.'});
        await trx('alarisa_property_type').insert([['code', 'string'], ['title', 'string'], ['description', 'text']].map(([code, value_type], id) => ({id: id + 1, code, value_type})));
        await trx('alarisa_relation_type').insert(relationCodes.map((code, id) => ({id: id + 1, code, description: code === 'case-parent' ? 'Primary Case Map placement.' : null})));
        await trx('alarisa_object').insert(cases.map((item) => ({id: byCode.get(item.id).objectId})));
        await trx('alarisa_component').insert(cases.map((item) => ({id: byCode.get(item.id).objectId, object_id: byCode.get(item.id).objectId, type_id: 1})));
        let propertyId = 1;
        const properties = [];
        for (const item of cases) for (const [typeId, key] of ['code', 'title', 'description'].entries()) properties.push({id: propertyId++, component_id: byCode.get(item.id).objectId, type_id: typeId + 1, value: JSON.stringify(item[key] ?? null)});
        await trx('alarisa_property').insert(properties);
        const relationId = new Map(relationCodes.map((code, id) => [code, id + 1]));
        let id = 1;
        const relations = [];
        for (const item of cases) { if (item.parent !== null) relations.push({id: id++, source_object_id: byCode.get(item.id).objectId, relation_type_id: relationId.get('case-parent'), target_object_id: byCode.get(item.parent).objectId}); for (const link of item.links ?? []) relations.push({id: id++, source_object_id: byCode.get(item.id).objectId, relation_type_id: relationId.get(link.relation), target_object_id: byCode.get(link.case).objectId}); }
        await trx('alarisa_relation').insert(relations);
    });
    console.log(JSON.stringify({database: name, schema: schema.status, cases: cases.length, relations: relationCodes.length}));
    await connection.disconnect();
}
