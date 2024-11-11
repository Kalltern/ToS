/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ToSActor extends Actor {
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
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
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
    const systemData = actorData.system; //everything else
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the ability rating using ToS rules.
      ability.mod = Math.floor(15 + ability.value * 10);
    }
    // Debugging: Log the abilities
    console.log(systemData.abilities);
    // Calculate endurance
    const endurance = systemData.abilities.end.value; // Ensure endurance exists
    // Set health correctly under stats
    systemData.stats.health.max = endurance * 5; // Set health based on endurance

    //Loop through skill groups and add their ratings depending on their level and ability score
    const skillset1 = [0, 15, 25, 30, 35, 45, 50, 55, 65, 75, 85];
    const combatset1 = [0, 20, 25, 30, 35, 45, 50, 60, 65, 75, 80];
    const abilityScore = Object.values(systemData.abilities).map(
      (ability) => ability.value
    );

    // Iterate through skills
    for (let [key, skill] of Object.entries(systemData.skills)) {
      // Ensure skill type is valid and matches your criteria
      if (skill.type === 1) {
        // Use skill.id to find the corresponding ability

        skill.rating = skillset1[skill.value] + abilityScore[skill.id] * 3;
      }
    }
    // Iterate through combat skills
    for (let [key, cskill] of Object.entries(systemData.cskills)) {
      // Ensure skill type is valid and matches your criteria
      if (cskill.type === 1) {
        // Use skill.id to find the corresponding ability

        cskill.rating = combatset1[cskill.value] + abilityScore[cskill.id] * 3;
      }
    }

    // Define critical thresholds influenced by luck
    const luck = systemData.secondaryAbilities.lck.value;
    const baseCriticalSuccess = 5; // Base critical success threshold
    const baseCriticalFailure = 96; // Base critical failure threshold

    // Function to calculate thresholds for each skill type (e.g., skills, cskills)
    function calculateSkillThresholds(skillsObject) {
      for (const [key, skillData] of Object.entries(skillsObject)) {
        // Ensure skillData is defined and contains critical bonus properties
        const critBonus = skillData.critbonus || 0;
        const critFailPenalty = skillData.critfailpenalty || 0;

        // Calculate critical success threshold for each skill
        skillData.criticalSuccessThreshold = Math.max(
          1,
          baseCriticalSuccess + Math.max(0, luck) + critBonus
        );

        // Calculate critical failure threshold for each skill
        skillData.criticalFailureThreshold = Math.min(
          100,
          baseCriticalFailure - Math.max(0, -luck) - critFailPenalty
        );

        // Debug output to verify each skill's calculated thresholds
        console.log(
          `Skill ${key}: Critical Success Threshold ${skillData.criticalSuccessThreshold}, Critical Failure Threshold ${skillData.criticalFailureThreshold}`
        );
      }
    }

    // Calculate thresholds for regular skills and combat skills
    calculateSkillThresholds(systemData.skills);
    calculateSkillThresholds(systemData.cskills);

    // Global thresholds based on luck.value
    this.criticalSuccessThreshold = Math.max(
      1,
      baseCriticalSuccess + Math.max(0, luck)
    );

    this.criticalFailureThreshold = Math.min(
      100,
      baseCriticalFailure - Math.max(0, -luck)
    );

    // Store thresholds in actor data if needed
    actorData.criticalSuccessThreshold = this.criticalSuccessThreshold;
    actorData.criticalFailureThreshold = this.criticalFailureThreshold;

    // Debugging: Log all skills and combat skills
    console.log("Updated Skills:", systemData.skills);
    console.log("Updated Combat Skills:", systemData.cskills);
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== "character") return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== "npc") return;

    // Process additional NPC data here.
  }
}
