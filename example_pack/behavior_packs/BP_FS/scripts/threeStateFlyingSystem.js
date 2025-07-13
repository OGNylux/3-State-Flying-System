import { world, system, EasingType } from "@minecraft/server";
import { helicopters } from "Vehicle";
export function main() {
    flyingSystem();
    checkRide();
}
function flyingSystem() {
    system.runInterval(() => {
        for (const player of world.getPlayers({ tags: ["ridingHelicopter"] })) {
            const ride = getRide(player);
            if (ride) {
                const helicopter = helicopters.find(helicopter => helicopter.typeId === ride?.typeId);
                helicopter.entity = ride;
                setPlayerCamera(player, helicopter);
                switchModes(player, helicopter);
            }
            else if (player.hasTag("camera")) {
                player.removeTag("camera");
                player.camera.clear();
            }
            removeTags(player);
        }
    });
}
function setPlayerCamera(player, helicopter) {
    // change the z_direction_shift to shift the camera farther/closer to the player (-18, 2 for now).
    const entity = helicopter.entity;
    if (!entity || !player)
        return;
    const z_direction_shift = vectorMultiply(player.getViewDirection(), helicopter.z_direction_shift);
    const camera_location = vectorAdd(z_direction_shift, { x: player.location.x, y: player.location.y + helicopter.y_direction_shift, z: player.location.z });
    player.camera.setCamera("minecraft:free", {
        location: camera_location, facingEntity: player, rotation: player.getRotation(),
        easeOptions: { easeTime: 1, easeType: EasingType.Spring }
    });
}
function switchModes(player, helicopter) {
    // state-maschine for the flying system.
    const entity = helicopter.entity;
    if (player.isJumping) {
        player.setDynamicProperty("end", Date.now());
        if (!setHoverState(player, helicopter))
            player.setDynamicProperty("start", Date.now());
    }
    else if (entity?.hasTag("hovering")) {
        player.onScreenDisplay.setActionBar("Hovering");
        entity?.applyImpulse({ x: 0, y: 0.0784, z: 0 });
    }
    else if (!entity?.isOnGround) {
        entity?.removeTag("hovering");
        player.onScreenDisplay.setActionBar("Down");
        entity?.removeEffect("levitation");
        entity?.addEffect("slow_falling", 20, { amplifier: 0, showParticles: false });
    }
}
function setHoverState(player, helicopter) {
    // sets the hoverstate if the player double taps the ascend button in a 75-300ms timeframe.
    const lowerThreshold = 75;
    const upperThreshold = 300;
    const entity = helicopter.entity;
    const startTime = Number(player.getDynamicProperty("start")) || Date.now();
    const endTime = Number(player.getDynamicProperty("end")) || Date.now();
    const timeElapsed = endTime - startTime;
    if (timeElapsed > lowerThreshold && timeElapsed < upperThreshold) {
        entity?.addTag("hovering");
        return true;
    }
    else {
        entity?.removeEffect("slow_falling");
        entity?.addEffect("levitation", 20, { amplifier: 5, showParticles: false });
        player.onScreenDisplay.setActionBar("Up");
        entity?.removeTag("hovering");
        return false;
    }
}
function removeTags(player) {
    // removes hovering tag when the entity hits the ground.
    for (const helicopter of world.getDimension(player.dimension.id).getEntities({ families: ["helicopter"] })) {
        if (helicopter.isOnGround && helicopter.hasTag("hovering"))
            helicopter.removeTag("hovering");
    }
}
function checkRide() {
    // adds the riding tag if a player rides a valid entity (check threeStateFlyTypes constant).
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            const ride = getRide(player);
            if (ride?.getComponent("type_family")?.hasTypeFamily("helicopter")) {
                player.addTag("ridingHelicopter");
                player.addTag("camera");
            }
            else
                player.removeTag("ridingHelicopter");
        }
    });
}
const getRide = (entity) => {
    return entity.getComponent("minecraft:riding")?.entityRidingOn;
};
function vectorMultiply(vector, multiplier) {
    return { x: vector.x * multiplier, y: vector.y * multiplier, z: vector.z * multiplier };
}
function vectorAdd(vector1, vector2) {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y, z: vector1.z + vector2.z };
}
