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
  if (!fs.existsSync(DATA_FILE)) {
    return { checkins: {}, weights: {} };
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("motivate")
    .setDescription("Get instant gym motivation."),

  new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Get playful toxic gym motivation."),

  new SlashCommandBuilder()
    .setName("protein")
    .setDescription("Get a protein reminder."),

  new SlashCommandBuilder()
    .setName("bulk")
    .setDescription("Get a lean bulk reminder."),

  new SlashCommandBuilder()
    .setName("water")
    .setDescription("Get a hydration reminder."),

  new SlashCommandBuilder()
    .setName("legday")
    .setDescription("Get a leg day reminder."),

  new SlashCommandBuilder()
    .setName("mealprep")
    .setDescription("Get a meal prep reminder."),

  new SlashCommandBuilder()
    .setName("goggins")
    .setDescription("Get hard-mode motivation."),

  new SlashCommandBuilder()
    .setName("checkin")
    .setDescription("Log your workout for today."),

  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Check your current workout streak."),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the workout check-in leaderboard."),

  new SlashCommandBuilder()
    .setName("weight")
    .setDescription("Log your body weight.")
    .addNumberOption(option =>
      option
        .setName("kg")
        .setDescription("Your body weight in kg")
        .setRequired(true)
    )
].map(command => command.toJSON());

const motivationMessages = [
  "🔥 You do not need perfect motivation. You need one clean session today.",
  "🏋️ Train like future you is watching. Because he is.",
  "📈 Tiny progress still compounds. Stack the reps.",
  "💪 Show up tired. Show up busy. Show up anyway.",
  "🧠 Discipline is just self-respect with a schedule.",
  "🚀 One workout will not change everything, but skipping again keeps you the same."
];

const roastMessages = [
  "💀 The only heavy thing you lifted today better not be your phone.",
  "🤡 You want a dream body but negotiate with warm-up sets.",
  "👀 Bro opened Discord before opening the gym door.",
  "💀 Your excuses are doing more reps than you.",
  "🫵 Respectfully, stop being allergic to effort.",
  "🚨 No workout, no complaining about results."
];

const proteinMessages = [
  "🥩 Protein check. Hit your target before your muscles file a complaint.",
  "🍗 Chicken, eggs, tuna, Greek yogurt. Pick your fighter.",
  "💪 You cannot build muscle on vibes and one sad banana.",
  "🥛 Protein first. Random snacks later.",
  "📊 Your training needs recovery. Recovery needs protein."
];

const bulkMessages = [
  "🍚 Lean bulk reminder: eat enough, train hard, do not dirty bulk like a raccoon.",
  "📈 Scale slowly up. Strength slowly up. That is the bulk.",
  "🍌 Carbs are not the enemy. Weak workouts are.",
  "🥩 Protein, carbs, fats. Stop guessing and start tracking.",
  "🔥 Build muscle, not just a collection of excuses."
];

const waterMessages = [
  "💧 Drink water. Your pump is not powered by iced coffee alone.",
  "🚰 Hydrate before your body starts running on low battery mode.",
  "💦 Water check. Clear pee, clear mission.",
  "🧊 Your muscles need water. Stop being a dry raisin."
];

const legdayMessages = [
  "🦵 Leg day is not optional. Your upper body cannot carry the whole brand.",
  "💀 Skipping legs is character development in the wrong direction.",
  "🏋️ Squat, hinge, lunge. Build the foundation.",
  "🚨 Chicken legs detected. Report to the squat rack."
];

const mealPrepMessages = [
  "🍱 Meal prep reminder: chicken, rice, spinach. Stop overcomplicating greatness.",
  "🍚 Cook the food before hunger turns you into a delivery app victim.",
  "🥦 Meal prep is discipline you can eat.",
  "📦 Future you deserves ready meals, not panic snacks."
];

const gogginsMessages = [
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
    if (userCheckins.includes(key)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff5733)
    .setFooter({ text: "GymRat Mate • Fun-toxic fitness accountability" });
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

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await registerCommands();

  await sendScheduledMessage(
    "🏋️ GymRat Mate is online",
    "No excuses. Your future physique is watching."
  );

  cron.schedule(
    "0 8 * * *",
    async () => {
      await sendScheduledMessage(
        "🌅 8AM Coach Check",
        `${randomFrom(motivationMessages)}\n\n${randomFrom(proteinMessages)}`
      );
    },
    { timezone: "Australia/Melbourne" }
  );

  cron.schedule(
    "0 16 * * *",
    async () => {
      await sendScheduledMessage(
        "🔥 4PM Gym Reminder",
        `${randomFrom(roastMessages)}\n\n${randomFrom(bulkMessages)}`
      );
    },
    { timezone: "Australia/Melbourne" }
  );

  cron.schedule(
    "0 12 * * *",
    async () => {
      await sendScheduledMessage(
        "🥩 Midday Protein Check",
        randomFrom(proteinMessages)
      );
    },
    { timezone: "Australia/Melbourne" }
  );

  cron.schedule(
    "0 19 * * 0",
    async () => {
      await sendScheduledMessage(
        "📊 Weekly Accountability",
        "React mentally: 💪 trained 5+ times, 😐 trained 3–4 times, 💀 need to lock in next week."
      );
    },
    { timezone: "Australia/Melbourne" }
  );

  console.log("Reminders scheduled: 8AM, 12PM, 4PM, Sunday 7PM.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const userId = interaction.user.id;
  const username = interaction.user.username;

  if (interaction.commandName === "motivate") {
    return interaction.reply({
      embeds: [makeEmbed("🔥 Coach Motivation", randomFrom(motivationMessages))]
    });
  }

  if (interaction.commandName === "roast") {
    return interaction.reply({
      embeds: [makeEmbed("💀 Fun-Toxic Roast", randomFrom(roastMessages))]
    });
  }

  if (interaction.commandName === "protein") {
    return interaction.reply({
      embeds: [makeEmbed("🥩 Protein Check", randomFrom(proteinMessages))]
    });
  }

  if (interaction.commandName === "bulk") {
    return interaction.reply({
      embeds: [makeEmbed("🍚 Lean Bulk Reminder", randomFrom(bulkMessages))]
    });
  }

  if (interaction.commandName === "water") {
    return interaction.reply({
      embeds: [makeEmbed("💧 Hydration Check", randomFrom(waterMessages))]
    });
  }

  if (interaction.commandName === "legday") {
    return interaction.reply({
      embeds: [makeEmbed("🦵 Leg Day Police", randomFrom(legdayMessages))]
    });
  }

  if (interaction.commandName === "mealprep") {
    return interaction.reply({
      embeds: [makeEmbed("🍱 Meal Prep Coach", randomFrom(mealPrepMessages))]
    });
  }

  if (interaction.commandName === "goggins") {
    return interaction.reply({
      embeds: [makeEmbed("⚔️ Hard Mode", randomFrom(gogginsMessages))]
    });
  }

  if (interaction.commandName === "checkin") {
    const today = todayKey();

    if (!data.checkins[userId]) {
      data.checkins[userId] = [];
    }

    if (!data.checkins[userId].includes(today)) {
      data.checkins[userId].push(today);
      saveData(data);
    }

    const streak = getUserStreak(userId, data);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "✅ Workout Logged",
          `🔥 ${username} completed a workout today.\nCurrent streak: **${streak} day(s)**\n\n${randomFrom(roastMessages)}`
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
      .map(([id, dates]) => ({
        id,
        total: dates.length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (leaderboard.length === 0) {
      return interaction.reply({
        embeds: [
          makeEmbed(
            "📊 Leaderboard",
            "No check-ins yet. Be the first to stop being allergic to effort."
          )
        ]
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

    if (!data.weights[userId]) {
      data.weights[userId] = [];
    }

    data.weights[userId].push({
      date: today,
      kg
    });

    saveData(data);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "⚖️ Weight Logged",
          `${username}, weight logged: **${kg} kg**.\nCoach note: track the weekly average, not just one random scale mood swing.`
        )
      ]
    });
  }
});

client.login(process.env.TOKEN);