class Vehicle {
    constructor(typeId, z_direction_shift, y_direction_shift) {
        this.typeId = typeId;
        this.z_direction_shift = z_direction_shift;
        this.y_direction_shift = y_direction_shift;
    }
}
const heli_solution = new Vehicle("nylux:test_pig", -18, 2);
const helicopters = [heli_solution];
export { helicopters, Vehicle };
