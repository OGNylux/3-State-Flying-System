import { world, system, Vector } from "@minecraft/server"
import { viewFlyTypes, threeStateFlyTypes, dimensionIdObject } from "../main"

export function main(){
    flyingSystem()
    checkRide()
}

function flyingSystem() {
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            if(player.hasTag("ridingHelicopter")) { 
                const ride = getRide(player)
                setPlayerCamera(player)
                switchModes(player, ride)
            } else if(!checkFamily(getRide(player), player, viewFlyTypes)) player.camera.clear()
            removeTags(player)
        }
    })
}

function setPlayerCamera(player) {
    // change the z_direction_shift to shift the camera farther/closer to the player (-18 for now).
    const z_direction_shift = Vector.multiply(player.getViewDirection(), -18)
    const camera_location = Vector.add(z_direction_shift, {x: player.location.x, y: player.location.y+2 ,z: player.location.z})
    player.camera.setCamera("minecraft:free", {
        location : camera_location, facingEntity: {facingEntity: player}, rotation: player.getRotation(),
        easeOptions : { easeTime : 1,  easeType : 'Spring' } } )
}

function switchModes(player, ride) {
    // state-maschine for the flying system.
    if(player.isJumping) {
        player.setDynamicProperty("end", Date.now())
        if(!setHoverState(player, ride)) player.setDynamicProperty("start", Date.now())
    } else if(ride?.hasTag("hovering")) {
        player.onScreenDisplay.setActionBar(" ")
        ride?.applyImpulse({ x: 0, y: 0.0784, z: 0 })
    } else if(!ride?.isOnGround) {
        ride?.removeTag("hovering")
        player.onScreenDisplay.setActionBar("")
        ride?.removeEffect("levitation")
        ride?.addEffect("slow_falling", 20, { amplifier: 0, showParticles: false })
    }
}

function setHoverState(player, ride) {
    // sets the hoverstate if the player double taps the ascend button in a 75-300ms timeframe.
    let timeElapsed = (player.getDynamicProperty("end") - player.getDynamicProperty("start"));
    if(timeElapsed > 75 && timeElapsed < 300) { 
        ride?.addTag("hovering") 
        return true
    } else {
        ride?.removeEffect("slow_falling")
        ride?.addEffect("levitation", 20, { amplifier: 5, showParticles: false })
        player.onScreenDisplay.setActionBar("")
        ride?.removeTag("hovering")
        return false
    }
}

function removeTags(player) {
    // removes hovering tag when the entity hits the ground.
    for(const helicopter of world.getDimension(dimensionIdObject[player.dimension.id]).getEntities({families:threeStateFlyTypes})) {
        if(helicopter.isOnGround && helicopter.hasTag("hovering")) helicopter.removeTag("hovering")
    }
}

function checkRide() {
    // adds the riding tag if a player rides a valid entity (check threeStateFlyTypes constant).
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            if (checkFamily(getRide(player), player, threeStateFlyTypes)) player.addTag("ridingHelicopter")
            else player.removeTag("ridingHelicopter")
        }
    })
}

function checkFamily(entity, player, families) {
    // This ensures that the specified entity is a valid rideable entity.
    for(const family of families) {
        const entities = world.getDimension(dimensionIdObject[player.dimension.id]).getEntities({ families: [family] });
        
        for (const e of entities) {
            if (e?.typeId === entity?.typeId) {
                return family;
            }
        }
    }
}

const getRide = (entity) => {
    return entity.getComponent("minecraft:riding")?.entityRidingOn
}
