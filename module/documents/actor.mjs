/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class TosActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.tos || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    // Loop through ability scores, and add their modifiers to our sheet output.
    // make combat group and group for other skills that use different array
    const combat = [0, 20, 25, 30, 35, 45, 50, 55, 60, 70, 80]; // for melee combat both attack and deffense, for ranged combat just attack
    const combatThrowAndDefense = [0, 10, 20, 25, 30, 35, 40, 45, 50, 55, 60]; // throw skill,  ranged defense from melee combat and ranged combat
    const ranger = [0, 18, 21, 24, 27, 35, 38, 41, 44, 52, 60]; // only for melee
    const group1 = [0, 15, 25, 30, 35, 45, 50, 55, 65, 75, 85]; //everything else
    const group2 = [0, 5, 10, 15, 20, 30]; // muscles, nimbleness
    const group3 = [0, 25, 40, 55, 70, 85]; //riding and sailing
    const group4 = [0, 40, 65, 90]; //dancing, meditation
    const group5 = [0, 10, 20, 30, 40, 50]; //drinking
    const group6 = [0, 5, 10, 15, 20, 25]; //social
    const group7 = [0, 20, 30, 40, 50, 60]; //survival

    const attributes = Object.values(data.abilities);
    const valuesOfAbilities = attributes.map((attribute) => attribute.value);
    const luck = data.abilities2.lck.value;
    const skillmod = 0;

    //   const cgroup = [0, 20, 25, 30, 35, 45, 50, 55, 60, 70, 80];
    for (let [key, skill] of Object.entries(data.skillsdata.skills)) {
      if (skill.type === 1) {
        skill.rating =
          group1[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      } else if (skill.type === 2) {
        skill.rating =
          group2[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      } else if (skill.type === 3) {
        skill.rating =
          group3[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      } else if (skill.type === 4) {
        skill.rating =
          group4[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      } else if (skill.type === 5) {
        skill.rating =
          group5[skill.value] + valuesOfAbilities[skill.id] * 6 + 0;
      } else if (skill.type === 6) {
        skill.rating =
          group6[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      } else if (skill.type === 7) {
        skill.rating =
          group7[skill.value] + valuesOfAbilities[skill.id] * 3 + 0;
      }

      //    cskill.rating = cgroup[cskill.value];
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    data.xp = data.cr * data.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== "character") return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    if (data.abilities2) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    if (data.stats) {
      for (let [k, v] of Object.entries(data.stats)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    if (data.skillsdata.skills) {
      for (let [k, v] of Object.entries(data.skillsdata.skills)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== "npc") return;

    // Process additional NPC data here.
  }
}
