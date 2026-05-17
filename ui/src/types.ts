export type Vec3 = { x: number; y: number; z: number };

export type PropState = {
    id: number;
    model: string;
    position: Vec3;
    rotation: Vec3;
};

export type Slot = {
    name: string;
    count: number;
};
