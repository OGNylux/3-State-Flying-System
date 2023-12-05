import { world, system, Vector } from "@minecraft/server"

let filter = {
    families: [ "helicopter" ]
}

const dimensionIdObject = {
    "minecraft:overworld" : "overworld",
    "minecraft:nether" : "nether",
    "minecraft:the_end" : "the_end",
}

export function main(){
    flyingSystem()
    check_ride()
}

function flyingSystem() {
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            if(player.hasTag("riding")) { 
                const ride = getRide(player)
                setPlayerCamera(player)
                switch_modes(player, ride)
                if(!player.hasTag("riding")) ride?.removeTag("hovering") 
            } else player.camera.clear()
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

function switch_modes(player, ride) {
    // state-maschine for the flying system
    if(player.isJumping) {
        player.setDynamicProperty("end", Date.now())
        if(setHoverState(player, ride)) return
        player.setDynamicProperty("start", Date.now())
    } else if(ride?.hasTag("hovering")) {
        player.onScreenDisplay.setActionBar(" ")
        ride?.triggerEvent("evt:flight_hover")
    } else if(!ride?.isOnGround) {
        ride?.removeTag("hovering")
        player.onScreenDisplay.setActionBar("")
        ride?.triggerEvent("evt:flight_down")
    }
}

function setHoverState(player, ride) {
    // sets the hoverstate if the player double taps the ascend button in a 75-300ms timeframe.
    let timeElapsed = (player.getDynamicProperty("end") - player.getDynamicProperty("start"));
    if(timeElapsed > 75 && timeElapsed < 300) { 
        ride?.addTag("hovering") 
        return true
    } else {
        ride?.triggerEvent("evt:flight_up") 
        player.onScreenDisplay.setActionBar("")
        ride?.removeTag("hovering")
        return false
    }
}

function removeTags(player) {
    // removes hovering tag when the entity hits the ground.
    for(const helicopter of world.getDimension(dimensionIdObject[player.dimension.id]).getEntities(filter)) {
        if(helicopter.isOnGround && helicopter.hasTag("hovering")) helicopter.removeTag("hovering")
    }
}

function check_ride() {
    // adds the riding tag if a player rides a valid entity (check filter constant).
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            if (getRide(player)?.matches(filter)) player.addTag("riding")
            else player.removeTag("riding")
        }
    })
}

const getRide = (entity) => {
    return entity.getComponent("minecraft:riding")?.entityRidingOn
}
