export type PropCatalogEntry = {
    model: string;
    label: string;
};

export const PROP_CATALOG: PropCatalogEntry[] = [
    { model: 'prop_couch_01', label: 'Sofa 1' },
    { model: 'prop_couch_03', label: 'Sofa 2' },
    { model: 'prop_couch_04', label: 'Sofa 3' },
    { model: 'prop_mp_cone_01', label: 'Traffic cone' },
    { model: 'prop_barrier_work06a', label: 'Barrier (plain)' },
    { model: 'prop_barrier_work05', label: 'Barrier (police)' },
    { model: 'prop_barrier_work06b', label: 'Barrier (contruction)' },
    { model: 'prop_rio_del_01', label: 'Tree 1' },
    { model: 'prop_tree_pine_01', label: 'Tree 2' },
    { model: 'prop_tree_eng_oak_01', label: 'Tree 3' },
    { model: 'prop_dumpster_3a', label: 'Dumpster 1' },
    { model: 'prop_dumpster_4b', label: 'Dumpster 2' },
    { model: 'prop_skip_03', label: 'Dumpster 3' },
    { model: 'prop_dumpster_01a', label: 'Dumpster 4' },
    { model: 'prop_dumpster_4a', label: 'Dumpster 5' },
    { model: 'prop_prlg_snowpile', label: 'Snowman' },
    { model: 'prop_xmas_tree_int', label: 'Xmas Tree' },
];

export function getPropLabel(model: string): string {
    return PROP_CATALOG.find(p => p.model === model)?.label ?? model;
}