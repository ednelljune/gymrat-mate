require("dotenv").config();

const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const DATA_FILE = path.join(__dirname, "fitness-data.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { checkins: {}, weights: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder().setName("motivate").setDescription("Instant gym motivation."),
  new SlashCommandBuilder().setName("roast").setDescription("Fun-toxic gym roast."),
  new SlashCommandBuilder().setName("protein").setDescription("Protein reminder."),
  new SlashCommandBuilder().setName("bulk").setDescription("Lean bulk reminder."),
  new SlashCommandBuilder().setName("water").setDescription("Hydration reminder."),
  new SlashCommandBuilder().setName("legday").setDescription("Leg day reminder."),
  new SlashCommandBuilder().setName("mealprep").setDescription("Meal prep reminder."),
  new SlashCommandBuilder().setName("goggins").setDescription("Hard-mode motivation."),
  new SlashCommandBuilder().setName("checkin").setDescription("Log today’s workout."),
  new SlashCommandBuilder().setName("streak").setDescription("Check your workout streak."),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Workout leaderboard."),
  new SlashCommandBuilder()
    .setName("weight")
    .setDescription("Log your body weight.")
    .addNumberOption(option =>
      option.setName("kg").setDescription("Your weight in kg").setRequired(true)
    )
].map(command => command.toJSON());

const motivation = [
  "🔥 You do not need perfect motivation. You need one clean session today.",
  "🏋️ Train like future you is watching. Because he is.",
  "📈 Small progress still compounds. Stack the reps.",
  "💪 Show up tired. Show up busy. Show up anyway.",
  "🧠 Discipline is self-respect with a schedule.",
  "🚀 One workout will not change everything, but skipping again keeps you the same."
];

const roast = [
  "💀 The only heavy thing you lifted today better not be your phone.",
  "🤡 You want a dream body but negotiate with warm-up sets.",
  "👀 Bro opened Discord before opening the gym door.",
  "💀 Your excuses are doing more reps than you.",
  "🫵 Respectfully, stop being allergic to effort.",
  "🚨 No workout, no complaining about results."
];

const protein = [
  "🥩 Protein check. Hit your target before your muscles file a complaint.",
  "🍗 Chicken, eggs, tuna, Greek yogurt. Pick your fighter.",
  "💪 You cannot build muscle on vibes and one sad banana.",
  "🥛 Protein first. Random snacks later.",
  "📊 Training needs recovery. Recovery needs protein."
];

const bulk = [
  "🍚 Lean bulk reminder: eat enough, train hard, do not dirty bulk like a raccoon.",
  "📈 Scale slowly up. Strength slowly up. That is the bulk.",
  "🍌 Carbs are not the enemy. Weak workouts are.",
  "🥩 Protein, carbs, fats. Stop guessing and start tracking.",
  "🔥 Build muscle, not just a collection of excuses."
];

const water = [
  "💧 Drink water. Your pump is not powered by iced coffee alone.",
  "🚰 Hydrate before your body starts running on low battery mode.",
  "💦 Water check. Clear pee, clear mission.",
  "🧊 Your muscles need water. Stop being a dry raisin."
];

const legday = [
  "🦵 Leg day is not optional. Your upper body cannot carry the whole brand.",
  "💀 Skipping legs is character development in the wrong direction.",
  "🏋️ Squat, hinge, lunge. Build the foundation.",
  "🚨 Chicken legs detected. Report to the squat rack."
];

const mealprep = [
  "🍱 Meal prep reminder: chicken, rice, spinach. Stop overcomplicating greatness.",
  "🍚 Cook the food before hunger turns you into a delivery app victim.",
  "🥦 Meal prep is discipline you can eat.",
  "📦 Future you deserves ready meals, not panic snacks."
];

const recovery = [
  "😴 Sleep reminder. Muscle grows when you recover, not when you doom-scroll.",
  "🛌 You cannot out-train bad sleep forever.",
  "🌙 Recovery is part of the program. Go sleep like an athlete.",
  "💤 Trying to bulk on 5 hours of sleep is NPC behavior."
];

const progress = [
  "📸 Progress photo reminder. The mirror lies. Photos keep receipts.",
  "📷 Take front, side, and back photos. Same lighting. Same pose. No ego.",
  "👀 You will not notice weekly changes unless you track them.",
  "📈 Progress photos > random mirror panic."
];

const weighin = [
  "⚖️ Weekly weigh-in. Track the trend, not today’s emotional scale drama.",
  "📊 One weigh-in means little. Weekly average tells the truth.",
  "⚖️ Weigh in, log it, move on. No overthinking.",
  "📈 Lean bulk rule: slow increase, better lifts, clean consistency."
];

const goggins = [
  "🔥 Hard mode: do the set you were trying to avoid.",
  "🛶 Who is going to carry the boats? Apparently you, after warm-up.",
  "🧠 Your mind quits first. Your body still has reps.",
  "⚔️ Nobody is coming to save your physique. Go work."
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Melbourne"
  });
}

function dateKeyMinus(days) {
  const now = new Date();
  const melbourneDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Australia/Melbourne" })
  );
  melbourneDate.setDate(melbourneDate.getDate() - days);
  return melbourneDate.toISOString().slice(0, 10);
}

function getUserStreak(userId, data) {
  const userCheckins = data.checkins[userId] || [];
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const key = dateKeyMinus(i);
    if (userCheckins.includes(key)) streak++;
    else break;
  }

  return streak;
}

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff5733)
    .setFooter({ text: "GymRat Mate V3 • Coach mode activated" });
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");
}

async function sendScheduledMessage(title, message) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      embeds: [makeEmbed(title, message)]
    });
  } catch (error) {
    console.error("Scheduled message error:", error);
  }
}

async function sendMentionMessage(title, message) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send({
      content: process.env.CHECKIN_MENTION || "@everyone",
      embeds: [makeEmbed(title, message)],
      allowedMentions: {
        parse: ["everyone", "roles"]
      }
    });
  } catch (error) {
    console.error("Mention message error:", error);
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await registerCommands();

  await sendScheduledMessage(
    "🏋️ GymRat Mate V3 is online",
    "Coach mode activated. Daily check-ins, night check-outs, reminders, and accountability are now live."
  );

  cron.schedule("0 7 * * *", async () => {
    await sendMentionMessage(
      "🌅 Daily Morning Check-In",
      "Good morning team.\n\nHow are you feeling today?\nWhat is your plan for the day?\n\nReply using this format:\n\n**Mood:**\n**Workout plan:**\n**Nutrition goal:**\n**Steps/cardio goal:**\n**One thing you will not skip today:**\n\nNo ghosting. Accountability starts now."
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("15 7 * * *", async () => {
    await sendScheduledMessage(
      "💧 7:15AM Hydration + Mindset",
      `${randomFrom(motivation)}\n\n${randomFrom(water)}`
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 8 * * *", async () => {
    await sendScheduledMessage(
      "🏋️ 8AM Training Reminder",
      `${randomFrom(roast)}\n\n${randomFrom(protein)}`
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 12 * * *", async () => {
    await sendScheduledMessage(
      "🥩 12PM Protein Check",
      randomFrom(protein)
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 16 * * *", async () => {
    await sendScheduledMessage(
      "🔥 4PM Gym Reminder",
      `${randomFrom(roast)}\n\n${randomFrom(bulk)}`
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 21 * * *", async () => {
    await sendMentionMessage(
      "🌙 Daily Night Check-Out",
      "End-of-day check-out.\n\nHow are you feeling after today?\nDid you complete your workout or movement goal?\nDid you hit your food/protein goal?\n\nReply using this format:\n\n**Mood:**\n**Workout done:** Yes/No\n**Nutrition:** On track / Needs work\n**Water:** Done / Needs work\n**Win of the day:**\n**Tomorrow’s focus:**\n\nBe honest. The dumbbells know."
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("15 21 * * *", async () => {
    await sendScheduledMessage(
      "😴 9:15PM Recovery Reminder",
      randomFrom(recovery)
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 8 * * 1", async () => {
    await sendScheduledMessage(
      "⚖️ Monday Weekly Weigh-In",
      randomFrom(weighin)
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 10 * * 6", async () => {
    await sendScheduledMessage(
      "📸 Saturday Progress Photos",
      randomFrom(progress)
    );
  }, { timezone: "Australia/Melbourne" });

  cron.schedule("0 19 * * 0", async () => {
    await sendScheduledMessage(
      "📊 Sunday Accountability Check",
      "React mentally:\n\n💪 Trained 5+ times\n😐 Trained 3–4 times\n💀 Need to lock in next week\n\nBe honest. The dumbbells know."
    );
  }, { timezone: "Australia/Melbourne" });

  console.log("V3 reminders scheduled.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const userId = interaction.user.id;
  const username = interaction.user.username;

  if (interaction.commandName === "motivate") {
    return interaction.reply({ embeds: [makeEmbed("🔥 Coach Motivation", randomFrom(motivation))] });
  }

  if (interaction.commandName === "roast") {
    return interaction.reply({ embeds: [makeEmbed("💀 Fun-Toxic Roast", randomFrom(roast))] });
  }

  if (interaction.commandName === "protein") {
    return interaction.reply({ embeds: [makeEmbed("🥩 Protein Check", randomFrom(protein))] });
  }

  if (interaction.commandName === "bulk") {
    return interaction.reply({ embeds: [makeEmbed("🍚 Lean Bulk Reminder", randomFrom(bulk))] });
  }

  if (interaction.commandName === "water") {
    return interaction.reply({ embeds: [makeEmbed("💧 Hydration Check", randomFrom(water))] });
  }

  if (interaction.commandName === "legday") {
    return interaction.reply({ embeds: [makeEmbed("🦵 Leg Day Police", randomFrom(legday))] });
  }

  if (interaction.commandName === "mealprep") {
    return interaction.reply({ embeds: [makeEmbed("🍱 Meal Prep Coach", randomFrom(mealprep))] });
  }

  if (interaction.commandName === "goggins") {
    return interaction.reply({ embeds: [makeEmbed("⚔️ Hard Mode", randomFrom(goggins))] });
  }

  if (interaction.commandName === "checkin") {
    const today = todayKey();

    if (!data.checkins[userId]) data.checkins[userId] = [];

    if (!data.checkins[userId].includes(today)) {
      data.checkins[userId].push(today);
      saveData(data);
    }

    const streak = getUserStreak(userId, data);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "✅ Workout Logged",
          `🔥 ${username} completed a workout today.\nCurrent streak: **${streak} day(s)**\n\n${randomFrom(roast)}`
        )
      ]
    });
  }

  if (interaction.commandName === "streak") {
    const streak = getUserStreak(userId, data);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "🔥 Current Streak",
          `${username}, your current workout streak is **${streak} day(s)**.`
        )
      ]
    });
  }

  if (interaction.commandName === "leaderboard") {
    const leaderboard = Object.entries(data.checkins)
      .map(([id, dates]) => ({ id, total: dates.length }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (leaderboard.length === 0) {
      return interaction.reply({
        embeds: [makeEmbed("📊 Leaderboard", "No check-ins yet. Be the first to lock in.")]
      });
    }

    const text = leaderboard
      .map((entry, index) => `${index + 1}. <@${entry.id}> — **${entry.total}** workouts`)
      .join("\n");

    return interaction.reply({
      embeds: [makeEmbed("🏆 Workout Leaderboard", text)]
    });
  }

  if (interaction.commandName === "weight") {
    const kg = interaction.options.getNumber("kg");
    const today = todayKey();

    if (!data.weights[userId]) data.weights[userId] = [];

    data.weights[userId].push({ date: today, kg });
    saveData(data);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "⚖️ Weight Logged",
          `${username}, weight logged: **${kg} kg**.\nCoach note: track weekly average, not one random scale mood swing.`
        )
      ]
    });
  }
});

client.login(process.env.TOKEN);