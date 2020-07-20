const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const WizardScene = require('telegraf/scenes/wizard');

const words = require('./words');


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const welcomeTxt = "I am an English teacher bot! My knowledge is based on" +
    " the Oxford 3000, a list of the 3000 most important words to learn in" +
    " English (in fact I have 3870 of them). If you know these 3000 most" +
    " common words, you can understand at least 95% of all conversations," +
    " books, newspapers, and email. Start training now, please click the 'Ask" +
    " me' button!"

bot.start(ctx => {
  ctx.reply(
      `Hello ${ctx.from.first_name}! ${welcomeTxt}`,
      Markup.inlineKeyboard([
        Markup.callbackButton('Ask me', 'ask_me'),
        Markup.callbackButton('Change the questions direction', 'question_direction')
      ]).extra()
  );
});

bot.action('question_direction', ctx => {
    ctx.reply(
        `Choose the questions direction`,
        Markup.inlineKeyboard([
            Markup.callbackButton('English to french', 'direction_0'),
            Markup.callbackButton('French to english', 'direction_1'),
            Markup.callbackButton('Random', 'direction_2')
        ]).extra()
    );
});

let questionDirection = 0;
let randomDirectionActive = 0;
function changeDirection (direction, ctx) {
    let text = '';
    if (direction === 0) {
        questionDirection = 0;
        randomDirectionActive = 0;
        text = 'The questions direction is now English to French !';
    }
    if (direction === 1) {
        questionDirection = 1;
        randomDirectionActive = 0;
        text = 'The questions direction is now French to English!';
    }
    if (direction === 2) {
        randomDirectionActive = 1;
        text = 'The questions direction is now random !';
    }
    ctx.reply(
        text,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Change the questions direction', 'question_direction')
        ]).extra()
    );
}

bot.action('direction_0', ctx => {
    changeDirection(0, ctx);
});

bot.action('direction_1', ctx => {
    changeDirection(1, ctx);
});

bot.action('direction_2', ctx => {
    changeDirection(2, ctx);
});

let currentQuestion = '';
function question (direction, idx) {
    if (direction === 0) {
        currentQuestion = 'How do you say *' + words.enWords[idx] + '* in' +
            ' French?';
    }
    if (direction === 1) {
        currentQuestion = 'How do you say *' + words.frWords[idx] + '* in' +
            ' English?';
    }
}

function randomModeChooseDirection () {
    if (getRandomInt(100) % 2 === 0) {
        questionDirection = 0;
    } else {
        questionDirection = 1;
    }
}

let score = 0;
const stepHandler = new Composer()
stepHandler.action('passAction', (ctx) => {
    let result = "";
    score = 0;
    if (questionDirection === 0) {
        result = `*${capitalizeFirstLetter(words.enWords[ctx.scene.session.wordsIdx])}* translation in French is *${capitalizeFirstLetter(words.frWords[ctx.scene.session.wordsIdx])}*`;
    }
    if (questionDirection === 1) {
        result = `*${capitalizeFirstLetter(words.frWords[ctx.scene.session.wordsIdx])}* translation in English is *${capitalizeFirstLetter(words.enWords[ctx.scene.session.wordsIdx])}*`;
    }
    ctx.reply(
        result,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Change the questions direction',
                'question_direction')])
            .extra({parse_mode: 'MarkdownV2'})
    );
    return ctx.scene.leave();
})
stepHandler.on('text', (ctx) => {
    let result = "";
    let answer = typeof ctx.message.text === 'string' ? ctx.message.text.toString().toLowerCase() : "";
    if (questionDirection === 0) {
        if (answer === words.frWords[ctx.scene.session.wordsIdx].toLowerCase()) {
            score++;
            result = score < 3 ? 'Good' : `Good, ${score} in a row\\!`;
        } else {
            result = `Wrong \n*${capitalizeFirstLetter(words.enWords[ctx.scene.session.wordsIdx])}* translation in French is *${capitalizeFirstLetter(words.frWords[ctx.scene.session.wordsIdx])}*`;
            score = 0;
        }
    }
    if (questionDirection === 1) {
        if (answer === words.enWords[ctx.scene.session.wordsIdx].toLowerCase()) {
            score++;
            result = score < 3 ? 'Good' : `Good, ${score} in a row\\!`;
        } else {
            result = `Wrong \n*${capitalizeFirstLetter(words.frWords[ctx.scene.session.wordsIdx])}* translation in English is *${capitalizeFirstLetter(words.enWords[ctx.scene.session.wordsIdx])}*`;
            score = 0;
        }
    }
    ctx.reply(
        result,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Change the questions direction',
                'question_direction')])
            .extra({parse_mode: 'MarkdownV2'})
    );
    return ctx.scene.leave();
})

const wizard = new WizardScene(
    'quiz_scene_id',
    (ctx) => {
      ctx.scene.session.wordsIdx = getRandomInt(3871);
      if (randomDirectionActive === 1) {
          randomModeChooseDirection();
      }
      question(questionDirection, ctx.scene.session.wordsIdx);
        ctx.reply(currentQuestion,
            Markup.inlineKeyboard([
                Markup.callbackButton('Pass', 'passAction'),
            ]).extra({parse_mode: 'MarkdownV2'}),
        );
      return ctx.wizard.next();
    },
    stepHandler,
)

const stage = new Stage([wizard]);
bot.use(session());
bot.use(stage.middleware());

bot.action('ask_me', Stage.enter('quiz_scene_id'));

bot.launch();