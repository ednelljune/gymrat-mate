require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const cron = require("node-cron");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const messages = [
    "💀 Bro opened Discord before opening the gym door.",
    "🔥 Consistency beats motivation. Go train.",
    "🏋️ Somebody weaker than you is already working out.",
    "👀 Your dream physique is waiting for you.",
    "🚨 Gym check. Have you trained yet?",
    "☕ Coffee first. Excuses never.",
    "🐺 The gym bros are already hunting.",
    "📈 Today's gains start with today's choices.",
    "🤡 Imagine paying for a gym membership just to admire the equipment.",
    "💪 Future you is begging you not to skip today.",
    "🔥 Be delusional enough to believe you're becoming your best self.",
    "🚫 No workout = no complaining about results.",
    "🏆 Small progress is still progress. Go earn it.",
    "💀 Your excuses are getting stronger than your muscles.",
    "⚠️ Reminder: The weights won't lift themselves."
];

function randomMessage() {
    return messages[Math.floor(Math.random() * messages.length)];
}

client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);

        await channel.send(
            "🏋️ **GymRat Mate is online!**\nNo excuses. Your future physique is watching."
        );

        console.log("Startup message sent.");
    } catch (error) {
        console.error("Could not send startup message:", error);
    }

    // 8:00 AM daily motivation
    cron.schedule(
        "0 8 * * *",
        async () => {
            try {
                const channel = await client.channels.fetch(process.env.CHANNEL_ID);
                await channel.send(`🌅 **Morning Motivation**\n${randomMessage()}`);
                console.log("8AM message sent.");
            } catch (error) {
                console.error("Error sending 8AM message:", error);
            }
        },
        {
            timezone: "Australia/Melbourne"
        }
    );

    // 4:00 PM daily motivation
    cron.schedule(
        "0 16 * * *",
        async () => {
            try {
                const channel = await client.channels.fetch(process.env.CHANNEL_ID);
                await channel.send(`🔥 **Afternoon Gym Check**\n${randomMessage()}`);
                console.log("4PM message sent.");
            } catch (error) {
                console.error("Error sending 4PM message:", error);
            }
        },
        {
            timezone: "Australia/Melbourne"
        }
    );

    console.log("Gym reminders scheduled for 8:00 AM and 4:00 PM.");
});

client.login(process.env.TOKEN);