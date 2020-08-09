const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
const Composer = require('telegraf/composer');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const WizardScene = require('telegraf/scenes/wizard');

const words = require('./words');

const languages = ['English', 'French', 'Polish', 'German', 'Vietnamese'];
let lang1 = 0;
let lang2 = 1;

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
        Markup.callbackButton('Settings', 'settings')
      ]).extra()
  );
});

bot.action('settings', ctx => {
    ctx.reply(
        `Choose the questions direction or change the languages.`,
        Markup.inlineKeyboard([
            [Markup.callbackButton('Change question direction', 'direct_change')],
            [Markup.callbackButton('Change the first language', 'lang_change_1')],
            [Markup.callbackButton('Change the second language', 'lang_change_2')],
        ]).extra()
    );
});
// change question direction
bot.action('direct_change', ctx => {
    ctx.reply(
        `Choose the questions direction`,
        Markup.inlineKeyboard([
            Markup.callbackButton(`${languages[lang1]} to ${languages[lang2]}`, 'direction_0'),
            Markup.callbackButton(`${languages[lang2]} to ${languages[lang1]}`, 'direction_1'),
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
        text = `The questions direction is now ${languages[lang1]} to ${languages[lang2]} !`;
    }
    if (direction === 1) {
        questionDirection = 1;
        randomDirectionActive = 0;
        text = `The questions direction is now ${languages[lang2]} to ${languages[lang1]} !`;
    }
    if (direction === 2) {
        randomDirectionActive = 1;
        text = 'The questions direction is now random !';
    }
    ctx.reply(
        text,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Settings', 'settings')
        ]).extra()
    );
}

for (let i = 0; i < 3; i++) {
    bot.action(`direction_${i}`, ctx => {
        changeDirection(i, ctx);
    });
}

// change lang1
bot.action('lang_change_1', ctx => {
    let langArray = languages.slice();
    delete langArray[lang2];
    let buttons = Object.keys(langArray).map(key => Markup.callbackButton(langArray[key], `first_lang_${key}`));
    langArray = languages.slice();
    ctx.reply(
        `Choose the first language.`,
        Extra.HTML().markup((m) => m.inlineKeyboard(buttons)
        )
    )
});

for (let i = 0; i < languages.length; i++) {
    bot.action(`first_lang_${i}`, ctx => {
        lang1 = i;
        ctx.reply(
            `The first language is now ${languages[i]}.`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Ask me', 'ask_me'),
                Markup.callbackButton('Settings', 'settings')
            ]).extra()
        )
    });
}
// change lang2
bot.action('lang_change_2', ctx => {
    let langArray = languages.slice();
    delete langArray[lang1];
    let buttons = Object.keys(langArray).map(key => Markup.callbackButton(langArray[key], `second_lang_${key}`));
    langArray = languages.slice();
    ctx.reply(
        `Choose the second language.`,
        Extra.HTML().markup((m) => m.inlineKeyboard(buttons)
        )
    )
});

for (let i = 0; i < languages.length; i++) {
    bot.action(`second_lang_${i}`, ctx => {
        lang2 = i;
        ctx.reply(
            `The second language is now ${languages[i]}.`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Ask me', 'ask_me'),
                Markup.callbackButton('Settings', 'settings')
            ]).extra()
        )
    });
}

let currentQuestion = '';
function questionGenerator (direction, idx) {
    if (direction === 0) {
        currentQuestion = `How do you say *${convertSpecialCar(words.WordsList[lang1][idx])}* in ${languages[lang2]}?`;
    }
    if (direction === 1) {
        currentQuestion = `How do you say *${convertSpecialCar(words.WordsList[lang2][idx])}* in ${languages[lang1]}?`;
    }
}

function randomModeChooseQuestionDirection () {
    if (getRandomInt(100) % 2 === 0) {
        questionDirection = 0;
    } else {
        questionDirection = 1;
    }
}

function convertSpecialCar (str) {
    let convertStr = str;
    if (str.indexOf('-') > -1) {
        let regex2 = /-/gi;
        convertStr = convertStr.replace(regex2, '\\-')
    }
    return convertStr;
}

let score = 0;
const stepHandler = new Composer()
// if user pass the question
stepHandler.action('passAction', (ctx) => {
    let result = "";
    score = 0;
    if (questionDirection === 0) {
        result = `*${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang1][ctx.scene.session.wordsIdx]))}* translation in ${languages[lang2]} is *${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang2][ctx.scene.session.wordsIdx]))}*`;
    }
    if (questionDirection === 1) {
        result = `*${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang2][ctx.scene.session.wordsIdx]))}* translation in ${languages[lang1]} is *${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang1][ctx.scene.session.wordsIdx]))}*`;
    }
    ctx.reply(
        result,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Settings', 'settings')
        ])
            .extra({parse_mode: 'MarkdownV2'})
    );
    return ctx.scene.leave();
})
// if user answers
stepHandler.on('text', (ctx) => {
    let result = "";
    let answer = typeof ctx.message.text === 'string' ? ctx.message.text.toString().toLowerCase() : "";
    if (questionDirection === 0) {
        if (convertSpecialCar(answer) === convertSpecialCar(words.WordsList[lang2][ctx.scene.session.wordsIdx].toLowerCase())) {
            score++;
            result = score < 3 ? 'Good' : `Good, ${score} in a row\\!`;
        } else {
            result = `Wrong\n*${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang1][ctx.scene.session.wordsIdx]))}* translation in ${languages[lang2]} is *${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang2][ctx.scene.session.wordsIdx]))}*`;
            score = 0;
        }
    }
    if (questionDirection === 1) {
        if (convertSpecialCar(answer) === convertSpecialCar(words.WordsList[lang1][ctx.scene.session.wordsIdx].toLowerCase())) {
            score++;
            result = score < 3 ? 'Good' : `Good, ${score} in a row\\!`;
        } else {
            result = `Wrong \n*${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang2][ctx.scene.session.wordsIdx]))}* translation in ${languages[lang1]} is *${convertSpecialCar(capitalizeFirstLetter(words.WordsList[lang1][ctx.scene.session.wordsIdx]))}*`;
            score = 0;
        }
    }
    ctx.reply(
        result,
        Markup.inlineKeyboard([
            Markup.callbackButton('Ask me', 'ask_me'),
            Markup.callbackButton('Settings',
                'settings')])
            .extra({parse_mode: 'MarkdownV2'})
    );
    return ctx.scene.leave();
})

const wizardQuiz = new WizardScene(
    'quiz_scene_id',
    (ctx) => {
      ctx.scene.session.wordsIdx = getRandomInt(3871);
      if (randomDirectionActive === 1) {
          randomModeChooseQuestionDirection();
      }
      questionGenerator(questionDirection, ctx.scene.session.wordsIdx);
        ctx.reply(currentQuestion,
            Markup.inlineKeyboard([
                Markup.callbackButton('Pass', 'passAction'),
            ]).extra({parse_mode: 'MarkdownV2'}),
        );
      return ctx.wizard.next();
    },
    stepHandler,
)

const stage = new Stage([wizardQuiz]);
bot.use(session());
bot.use(stage.middleware());

bot.action('ask_me', Stage.enter('quiz_scene_id'));

bot.launch();