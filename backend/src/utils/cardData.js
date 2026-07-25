const cardsData = [
  { id: 1, name: "Meditot", type: "Mystic", rarity: 1, hp: 50, image_file: "Elemental Awakening_01.png", special: null },
  { id: 2, name: "Zenquaza", type: "Mystic", rarity: 2, hp: 100, image_file: "Elemental Awakening_02.png", special: null },
  { id: 3, name: "Harmoniqueon", type: "Mystic", rarity: 3, hp: 110, image_file: "Elemental Awakening_03.png", special: null },
  { id: 4, name: "Traplet", type: "Mystic", rarity: 1, hp: 60, image_file: "Elemental Awakening_04.png", special: null },
  { id: 5, name: "Traphex", type: "Mystic", rarity: 3, hp: 120, image_file: "Elemental Awakening_05.png", special: null },
  { id: 6, name: "Chimerasprout", type: "Mystic", rarity: 1, hp: 60, image_file: "Elemental Awakening_06.png", special: null },
  { id: 7, name: "Chimerafluff", type: "Mystic", rarity: 2, hp: 90, image_file: "Elemental Awakening_07.png", special: null },
  { id: 8, name: "Chimereal", type: "Mystic", rarity: 4, hp: 140, image_file: "Elemental Awakening_08.png", special: null },
  { id: 9, name: "Pheonyx", type: "Mystic", rarity: 3, hp: 90, image_file: "Elemental Awakening_09.png", special: null, ability: "Phase Shift: The creature can move out of the active position and reappear on the bench after an attack" },
  { id: 10, name: "Mystikid", type: "Mystic", rarity: 1, hp: 40, image_file: "Elemental Awakening_10.png", special: null },
  { id: 11, name: "Mystikeon", type: "Mystic", rarity: 3, hp: 80, image_file: "Elemental Awakening_11.png", special: null, ability: "Camouflage: Your bench creatures can't be damaged" },
  { id: 12, name: "Spiritfoil", type: "Mystic", rarity: 1, hp: 60, image_file: "Elemental Awakening_12.png", special: null },
  { id: 13, name: "Nebulicorn", type: "Mystic", rarity: 2, hp: 80, image_file: "Elemental Awakening_13.png", special: null },
  { id: 14, name: "Wraithhorn", type: "Mystic", rarity: 3, hp: 90, image_file: "Elemental Awakening_14.png", special: null },
  { id: 15, name: "Zephyrquill", type: "Wind", rarity: 2, hp: 40, image_file: "Elemental Awakening_15.png", special: null },
  { id: 16, name: "Aeruffin", type: "Wind", rarity: 3, hp: 90, image_file: "Elemental Awakening_16.png", special: null },
  { id: 17, name: "Stormbud", type: "Wind", rarity: 1, hp: 30, image_file: "Elemental Awakening_17.png", special: null },
  { id: 18, name: "Blossomgale", type: "Wind", rarity: 3, hp: 80, image_file: "Elemental Awakening_18.png", special: null },
  { id: 19, name: "Dodolet", type: "Wind", rarity: 1, hp: 40, image_file: "Elemental Awakening_19.png", special: null },
  { id: 20, name: "Dodrift", type: "Wind", rarity: 2, hp: 60, image_file: "Elemental Awakening_20.png", special: null },
  { id: 21, name: "Dodoryphon", type: "Wind", rarity: 4, hp: 100, image_file: "Elemental Awakening_21.png", special: null },
  { id: 22, name: "Aeroquatic", type: "Wind", rarity: 1, hp: 70, image_file: "Elemental Awakening_22.png", special: null },
  { id: 23, name: "Prismarine", type: "Wind", rarity: 2, hp: 90, image_file: "Elemental Awakening_23.png", special: null, ability: "Rainbow Strike: When attacking, also deal 30 damage to a random creature from the opponent's bench." },
  { id: 24, name: "Pyrosora", type: "Wind", rarity: 4, hp: 100, image_file: "Elemental Awakening_24.png", special: null },
  { id: 25, name: "Batakaze", type: "Wind", rarity: 1, hp: 50, image_file: "Elemental Awakening_25.png", special: null },
  { id: 26, name: "Shadowflit", type: "Wind", rarity: 1, hp: 80, image_file: "Elemental Awakening_26.png", special: null },
  { id: 27, name: "Dewmo", type: "Neutral", rarity: 3, hp: 110, image_file: "Elemental Awakening_27.png", special: null },
  { id: 28, name: "Baklavaff", type: "Neutral", rarity: 1, hp: 70, image_file: "Elemental Awakening_28.png", special: null },
  { id: 29, name: "Galaktikreme", type: "Neutral", rarity: 2, hp: 110, image_file: "Elemental Awakening_29.png", special: null },
  { id: 30, name: "Antheara (a)", type: "Neutral", rarity: 2, hp: 50, image_file: "Elemental Awakening_30.png", special: null },
  { id: 31, name: "Antheara (b)", type: "Neutral", rarity: 2, hp: 70, image_file: "Elemental Awakening_31.png", special: null },
  { id: 32, name: "Antheara (c)", type: "Neutral", rarity: 2, hp: 50, image_file: "Elemental Awakening_32.png", special: null },
  { id: 33, name: "Antheara (d)", type: "Neutral", rarity: 2, hp: 50, image_file: "Elemental Awakening_33.png", special: null, ability: "Defense Aura: While in the active position, it takes 10 less damage from attacks." },
  { id: 34, name: "Babybara", type: "Neutral", rarity: 1, hp: 60, image_file: "Elemental Awakening_34.png", special: null },
  { id: 35, name: "Carmibara", type: "Neutral", rarity: 2, hp: 80, image_file: "Elemental Awakening_35.png", special: null },
  { id: 36, name: "Reddybara", type: "Neutral", rarity: 4, hp: 130, image_file: "Elemental Awakening_36.png", special: null, ability: "Sturdy Presence: When this creature is in play, all of your attacks deal 20 more damage" },
  { id: 37, name: "Serafini", type: "Neutral", rarity: 1, hp: 30, image_file: "Elemental Awakening_37.png", special: null },
  { id: 38, name: "Serafina", type: "Neutral", rarity: 3, hp: 60, image_file: "Elemental Awakening_38.png", special: null, ability: "Resourceful Recovery: Flip a coin. If heads, attach an energy to any of your creatures in play." },
  { id: 39, name: "Alpakina", type: "Neutral", rarity: 4, hp: 120, image_file: "Elemental Awakening_39.png", special: null },
  { id: 40, name: "Floonleef", type: "Celestial", rarity: 1, hp: 60, image_file: "Elemental Awakening_40.png", special: null },
  { id: 41, name: "Aerobloom", type: "Celestial", rarity: 2, hp: 80, image_file: "Elemental Awakening_41.png", special: null },
  { id: 42, name: "Rosbud", type: "Celestial", rarity: 1, hp: 60, image_file: "Elemental Awakening_42.png", special: null },
  { id: 43, name: "Rosalia", type: "Celestial", rarity: 2, hp: 90, image_file: "Elemental Awakening_43.png", special: null, ability: "Celestial Blessing: Heals one random celestial creature (including your opponent's) by 30 HP." },
  { id: 44, name: "Verdanthorn", type: "Celestial", rarity: 3, hp: 110, image_file: "Elemental Awakening_44.png", special: null },
  { id: 45, name: "Faeclover", type: "Celestial", rarity: 1, hp: 30, image_file: "Elemental Awakening_45.png", special: null },
  { id: 46, name: "Sunbloss", type: "Celestial", rarity: 3, hp: 90, image_file: "Elemental Awakening_46.png", special: null, ability: "Clarity Aura: Prevents all of your creatures from getting the Hallucination status condition." },
  { id: 47, name: "Aloebud", type: "Celestial", rarity: 1, hp: 50, image_file: "Elemental Awakening_47.png", special: null },
  { id: 48, name: "Aloeflora", type: "Celestial", rarity: 2, hp: 70, image_file: "Elemental Awakening_48.png", special: null },
  { id: 49, name: "Aloetide", type: "Celestial", rarity: 4, hp: 90, image_file: "Elemental Awakening_49.png", special: null },
  { id: 50, name: "Floretta", type: "Celestial", rarity: 1, hp: 60, image_file: "Elemental Awakening_50.png", special: null },
  { id: 51, name: "Lizaflora", type: "Celestial", rarity: 2, hp: 80, image_file: "Elemental Awakening_51.png", special: null },
  { id: 52, name: "Voltveil", type: "Mechanic", rarity: 2, hp: 80, image_file: "Elemental Awakening_52.png", special: null },
  { id: 53, name: "Byteblade", type: "Mechanic", rarity: 2, hp: 90, image_file: "Elemental Awakening_53.png", special: null },
  { id: 54, name: "Venomgear", type: "Mechanic", rarity: 1, hp: 60, image_file: "Elemental Awakening_54.png", special: null },
  { id: 55, name: "Toxiforge", type: "Mechanic", rarity: 3, hp: 110, image_file: "Elemental Awakening_55.png", special: null, ability: "Quick Reflexes: Flip 2 coins. If you get two heards, your opponent can't attack in the next turn." },
  { id: 56, name: "Envoye", type: "Mechanic", rarity: 2, hp: 100, image_file: "Elemental Awakening_56.png", special: null },
  { id: 57, name: "Struto", type: "Mechanic", rarity: 1, hp: 80, image_file: "Elemental Awakening_57.png", special: null },
  { id: 58, name: "Strutalon", type: "Mechanic", rarity: 3, hp: 130, image_file: "Elemental Awakening_58.png", special: null, ability: "Hard as Steel: This creature takes 30 less damage from neutral and mechanic creatures" },
  { id: 59, name: "Ponimetal", type: "Mechanic", rarity: 1, hp: 70, image_file: "Elemental Awakening_59.png", special: null },
  { id: 60, name: "Equinix", type: "Mechanic", rarity: 2, hp: 90, image_file: "Elemental Awakening_60.png", special: null },
  { id: 61, name: "Equinox", type: "Mechanic", rarity: 4, hp: 110, image_file: "Elemental Awakening_61.png", special: null, ability: "Aura of Strenght: Boosts the damage of any of your active creature attacks by 30 if you have a full bench." },
  { id: 62, name: "Metamonk", type: "Mechanic", rarity: 3, hp: 130, image_file: "Elemental Awakening_62.png", special: null },
  { id: 63, name: "Aeglet", type: "Mechanic", rarity: 1, hp: 60, image_file: "Elemental Awakening_63.png", special: null, ability: "Guardian's Call: You may flip a coin. If heads, evolve Aeglet into Aegiscelis from your hand." },
  { id: 64, name: "Aegiscelis", type: "Mechanic", rarity: 2, hp: 130, image_file: "Elemental Awakening_64.png", special: null, ability: "Guardian: Protects the active creature, taking damage on their behalf." },
  { id: 65, name: "Potion", type: "Item", rarity: 1, hp: null, image_file: "Elemental Awakening_65.png", special: null },
  { id: 66, name: "Card Draw", type: "Item", rarity: 1, hp: null, image_file: "Elemental Awakening_66.png", special: null },
  { id: 67, name: "Booster", type: "Item", rarity: 1, hp: null, image_file: "Elemental Awakening_67.png", special: null },
  { id: 68, name: "Power-Up", type: "Item", rarity: 1, hp: null, image_file: "Elemental Awakening_68.png", special: null },
  { id: 69, name: "Remedy", type: "Item", rarity: 1, hp: null, image_file: "Elemental Awakening_69.png", special: null },
  { id: 70, name: "Dragomind", type: "Mystic", rarity: 1, hp: 60, image_file: "Elemental Awakening_70.png", special: "Promo.png" },
  { id: 71, name: "Mindsheer", type: "Mystic", rarity: 2, hp: 80, image_file: "Elemental Awakening_71.png", special: "Promo.png" },
  { id: 72, name: "Psydrake", type: "Mystic", rarity: 3, hp: 110, image_file: "Elemental Awakening_72.png", special: "Promo.png" },
  { id: 73, name: "Blushbat", type: "Wind", rarity: 1, hp: 50, image_file: "Elemental Awakening_73.png", special: "Promo.png" },
  { id: 74, name: "Cerisebat", type: "Wind", rarity: 2, hp: 70, image_file: "Elemental Awakening_74.png", special: "Promo.png" },
  { id: 75, name: "Flutterwing", type: "Wind", rarity: 3, hp: 90, image_file: "Elemental Awakening_75.png", special: "Promo.png" },
  { id: 76, name: "Minkpaw", type: "Neutral", rarity: 1, hp: 50, image_file: "Elemental Awakening_76.png", special: "Promo.png" },
  { id: 77, name: "Furstream", type: "Neutral", rarity: 2, hp: 80, image_file: "Elemental Awakening_77.png", special: "Promo.png" },
  { id: 78, name: "Lumbertail", type: "Neutral", rarity: 3, hp: 100, image_file: "Elemental Awakening_78.png", special: "Promo.png", ability: "Energy Siphon: Whenever your opponent uses an item card, attach one energy to this creature." },
  { id: 79, name: "Astromelon", type: "Celestial", rarity: 1, hp: 60, image_file: "Elemental Awakening_79.png", special: "Promo.png" },
  { id: 80, name: "Lunamelon", type: "Celestial", rarity: 2, hp: 80, image_file: "Elemental Awakening_80.png", special: "Promo.png" },
  { id: 81, name: "Orbitmelon", type: "Celestial", rarity: 3, hp: 110, image_file: "Elemental Awakening_81.png", special: "Promo.png" },
  { id: 82, name: "Ghoulpole", type: "Mechanic", rarity: 1, hp: 70, image_file: "Elemental Awakening_82.png", special: "Promo.png" },
  { id: 83, name: "Apparitron", type: "Mechanic", rarity: 2, hp: 90, image_file: "Elemental Awakening_83.png", special: "Promo.png" },
  { id: 84, name: "Poltergnet", type: "Mechanic", rarity: 3, hp: 130, image_file: "Elemental Awakening_84.png", special: "Promo.png" }
];

function initializeCards(db) {
  cardsData.forEach(card => {
    db.run(
      `INSERT OR IGNORE INTO cards (id, name, type, rarity, hp, image_file, special_card, ability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [card.id, card.name, card.type, card.rarity, card.hp, card.image_file, card.special, card.ability || null]
    );
  });
}

// INSERT OR IGNORE above is a no-op on a DB that already has all 84 card rows (the
// common case), so the `ability` column added after initial launch needs its own
// always-run sync to reach existing installs.
function syncCardAbilities(db) {
  cardsData.forEach(card => {
    if (card.ability) {
      db.run(`UPDATE cards SET ability = ? WHERE id = ?`, [card.ability, card.id]);
    }
  });
}

module.exports = { cardsData, initializeCards, syncCardAbilities };
