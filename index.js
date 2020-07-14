const dotenv = require('dotenv');
dotenv.config();
const { Telegraf } = require('telegraf');
const Markup = require("telegraf/markup");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");

const words = require('./words');

let wordsIdx = 0;
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(ctx => {
  ctx.reply(
      `Hello ${ctx.from.first_name} !`,
      Markup.inlineKeyboard([
        Markup.callbackButton("Ask question", "askME")
      ]).extra()
  );
});

const askMe = new WizardScene(
    "ask_me",
    ctx => {
      wordsIdx = getRandomInt(4);
      ctx.reply(words.enWords[wordsIdx]);
      return ctx.wizard.next();
    },
    ctx => {
      ctx.wizard.state.currentQuestion = ctx.message.text;
      let result = ctx.message.text.toLowerCase() === words.frWords[wordsIdx].toLowerCase() ? 'good' : 'wrong'
      ctx.reply(
          result,
          Markup.inlineKeyboard([
            Markup.callbackButton("Ask question", "askME")
          ]).extra()
      );
      return ctx.scene.leave();
    }
)

const stage = new Stage([askMe], { default: "ask_me" }); // Scene registration
bot.use(session());
bot.use(stage.middleware());
bot.launch();