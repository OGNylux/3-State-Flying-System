import { world, system, Player, Entity, EasingType, Vector3 } from "@minecraft/server"
import { helicopters, Vehicle } from "Vehicle"

export function main() {
    flyingSystem()
    checkRide()
}

function flyingSystem() {
    /*    
        This system allows players to fly with helicopters in three different modes:
        1. Ascend: The player can ascend by double-tapping the ascend button.
        2. Hover: The player can hover in place by double-tapping the ascend button again.
        3. Descend: The player can descend by holding the descend button.
    */
    system.runInterval(() => {
        for (const player of world.getPlayers({ tags: ["ridingHelicopter"] })) {
            const ride: Entity = getRide(player)
            if(ride) { 
                const helicopter: Vehicle = helicopters.find(helicopter => helicopter.typeId === ride?.typeId)
                helicopter.entity = ride;

                setPlayerCamera(player, helicopter)
                switchModes(player, helicopter)
            } else if(player.hasTag("camera")) {
                player.removeTag("camera")
                player.camera.clear()
            }
            removeTags(player)
        }
    })
}

function setPlayerCamera(player: Player, helicopter: Vehicle) {
    /*        
        Sets the player's camera to follow the helicopter's position and orientation.
        The camera is positioned behind the helicopter, with a slight upward shift.
    */
    const entity: Entity = helicopter.entity
    if(!entity || !player) return;

    const z_direction_shift = vectorMultiply(player.getViewDirection(), helicopter.z_direction_shift)
    const camera_location = vectorAdd(z_direction_shift, {x: player.location.x, y: player.location.y+helicopter.y_direction_shift , z: player.location.z})

    player.camera.setCamera("minecraft:free", {
        location : camera_location, facingEntity: player, rotation: player.getRotation(),
        easeOptions : { easeTime : 1,  easeType : EasingType.Spring } } )
}

function switchModes(player: Player, helicopter: Vehicle) {
    /*        
        Switches between the three flying modes based on player input:
        - Ascend: Double-tap the ascend button to hover.
        - Hover: Hold the ascend button to hover in place.
        - Descend: Hold the descend button to fall down.
    */
    const entity: Entity = helicopter.entity

    if(player.isJumping) {
        player.setDynamicProperty("end", Date.now())
        if(!setHoverState(player, helicopter)) player.setDynamicProperty("start", Date.now())
    } else if(entity?.hasTag("hovering")) {
        player.onScreenDisplay.setActionBar("Hovering")
        entity?.applyImpulse({ x: 0, y: 0.0784, z: 0 })
    } else if(!entity?.isOnGround) {
        entity?.removeTag("hovering")
        player.onScreenDisplay.setActionBar("Down")
        entity?.removeEffect("levitation")
        entity?.addEffect("slow_falling", 20, { amplifier: 0, showParticles: false })
    }
}

function setHoverState(player: Player, helicopter: Vehicle) {
    /*        
        Sets the hover state based on the time elapsed between the last two jumps.
        If the time is within a certain range, the player hovers; otherwise, they go down.
    */
    const lowerThreshold = 75;
    const upperThreshold = 300;

    const entity: Entity = helicopter.entity

    const startTime = Number(player.getDynamicProperty("start")) || Date.now();
    const endTime = Number(player.getDynamicProperty("end")) || Date.now();

    const timeElapsed: number = endTime - startTime;
    if(timeElapsed > lowerThreshold && timeElapsed < upperThreshold) { 
        entity?.addTag("hovering") 
        return true
    } else {
        entity?.removeEffect("slow_falling")
        entity?.addEffect("levitation", 20, { amplifier: 5, showParticles: false })
        player.onScreenDisplay.setActionBar("Up")
        entity?.removeTag("hovering")
        return false
    }
}

function removeTags(player: Player) {
    /*        
        Removes the "hovering" tag from helicopters that are on the ground.
        This ensures that helicopters do not remain in a hovering state when they land.
    */
    for(const helicopter of world.getDimension(player.dimension.id).getEntities({families: ["helicopter"]})) {
        if(helicopter.isOnGround && helicopter.hasTag("hovering")) helicopter.removeTag("hovering")
    }
}

function checkRide() {
    /*        
        Checks if players are riding helicopters and adds the "ridingHelicopter" tag.
        This tag is used to identify players who are currently riding a helicopter.
    */
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            const ride: Entity = getRide(player)
            if (ride?.getComponent("type_family")?.hasTypeFamily("helicopter")) {
                player.addTag("ridingHelicopter")
                player.addTag("camera")
            }
            else player.removeTag("ridingHelicopter")
        }
    })
}

const getRide = (entity: Entity) => {
    /*        
        Retrieves the entity that the player is currently riding.
    */
    return entity.getComponent("minecraft:riding")?.entityRidingOn
}

function vectorMultiply(vector: Vector3, multiplier: number) {
    /*        
        Multiplies a vector by a scalar value.
    */
    return { x: vector.x * multiplier, y: vector.y * multiplier, z: vector.z * multiplier }
}

function vectorAdd(vector1: Vector3, vector2: Vector3) {
    /*        
        Adds two vectors together.
    */
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y, z: vector1.z + vector2.z }
}