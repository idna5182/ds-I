import { troopConfig } from '/twcheese/src/Util/TroopConfig.js';

let troopTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob', 'militia'];


function troopPop(troopType) {
    let troop = troopConfig.get(troopType);
    if (typeof troop === 'undefined') {
        return 0;
    }
    return troop.pop;
}


function travelMinutes(troopType) {
    let troop = troopConfig.get(troopType);
    if (typeof troop === 'undefined') {
        return 0;
    }
    return troop.speed;
}


function troopCarry(troopType) {
    let troop = troopConfig.get(troopType);
    if (typeof troop === 'undefined') {
        return 0;
    }
    return troop.carry;
}


class TroopCounts {
    constructor() {
        for (let type of troopTypes) {
            this[type] = 0;
        }
    }

    isZero() {
        for (let count of Object.values(this)) {
            if (count !== 0) {
                return false;
            }
        }
        return true;
    }

    populationUsed() {
        return troopTypes.reduce((sum, type) => sum + troopPop(type) * this[type], 0);
    }

    travelDuration(distance, role = 'attack', worldSpeed = 1, unitSpeed = 1) {
        let minutesPerField = this.travelMinutesPerField(role, worldSpeed, unitSpeed);
        return calcTravelDuration(minutesPerField, distance);
    }

    travelMinutesPerField(role = 'attack', worldSpeed = 1, unitSpeed = 1) {
        if (role === 'support' && this.knight > 0) {
            return travelMinutes('knight');
        }

        let relevantMinutes = troopTypes
            .filter(type => this[type] > 0)
            .map(type => travelMinutes(type));

        return Math.max(...relevantMinutes);
    }

    /**
     * @param {TroopCounts} subtrahend
     * @return {TroopCounts} difference
     */
    subtract(subtrahend) {
        let difference = new TroopCounts();
        for (let [troopType, count] of Object.entries(this)) {
            difference[troopType] = count - subtrahend[troopType];
        }
        return difference;
    }

    toArray() {
        return troopTypes.map(type => this[type]);
    }

    static fromArray(array) {
        let troops = new TroopCounts();
        array.forEach((count, i) => {
            troops[troopTypes[i]] = count;
        });
        return troops;
    }
}


/**
 *	@param {number} distance
 *	@param {number} worldSpeed
 *	@param {number} unitSpeed
 *	@return	{{spear:number, sword:number, ...}} milliseconds
 */
function calcTravelDurations(distance, worldSpeed, unitSpeed) {
    let travelTimes = {};
    for (let type of troopTypes) {
        travelTimes[type] = calcTravelDuration(travelMinutes(type), distance);
    }
    return travelTimes;
};


function calcTravelDuration(minutesPerField, distance) {
    // The game rounds travel duration to the nearest second.
    // The milliseconds part of the scheduled arrival is NOT some fraction of travel seconds.
    // But rather, copied from the clock when the server started processing the request to travel.
    //
    // e.g. The clock says its 12:30:00.123.
    // The server processes a request for troops to travel somewhere that takes them 10 minutes to reach.
    // The scheduled arrival will be 12:40:00.123
    return Math.round(distance * minutesPerField * 60) * 1000;
}


let TroopCalculator = {

    /** 
     * @param {string} troopType
     * @param {number} resourceAmount     
     * @param {number} haulBonus the extra % bonus haul from flags, events, etc. Example: 30 for 30%, NOT 0.3
     * @return {number} how many troops does it take to carry all the resources
     */
    countToCarry(troopType, resourceAmount, haulBonus = 0) {
        let haulPerUnit = troopCarry(troopType) * (100 + haulBonus) / 100;
        let troopCount = resourceAmount / haulPerUnit;
        return Math.round(10 * troopCount) / 10;
    },

    /**
     * @param {string} troopType 
     * @param {number} distance 
     * @param {number} worldSpeed 
     * @param {number} unitSpeed 
     * @return {number} milliseconds to travel
     */
    travelDuration(troopType, distance, worldSpeed = 1, unitSpeed = 1) {
        return calcTravelDuration(travelMinutes(troopType), distance);
    }

};


export { TroopCounts, calcTravelDurations, TroopCalculator, troopTypes };