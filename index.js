const TelegramBot = require('node-telegram-bot-api');

const db = require('./db'); // db connection 
const SAMO_CONTACT_GROUP = -4124375567;
const SAMO_JALOBI = -4128612943;
const SAMO_SEND_MESSAGES_GROUP = -4193748359;
const TOKEN = 'TOKEN';
const bot = new TelegramBot(TOKEN, 
{
    polling: 
    {
        interval: 300,
        autoStart: true
    }
    
});
bot.on("polling_error", err => console.log(err.data.error.message))

const commands = [
    {
        command: "start",
        description: "Запуск бота"
    },
    {
        command: "ref",
        description: "Получить реферальную ссылку"
    },
    {
        command: "menu",
        description: "Меню"  
    }
];

bot.setMyCommands(commands);

bot.setMyCommands(commands);
bot.on('photo', async msg => {
    if (msg.chat.id == SAMO_SEND_MESSAGES_GROUP) {
        let success = 0;
        let fails = 0;
        
        // Assuming db.query() returns a promise that resolves with an object containing a 'rows' property
        const result = await db.query(`SELECT * FROM samo`);
        const users = result.rows;

        for (let user of users) {
            try {
                // It's safer to use the largest available photo version
                const photoSizes = msg.photo;
                const largestPhoto = photoSizes[photoSizes.length - 1].file_id;
                await bot.sendPhoto(user.tg_id, largestPhoto, { caption: msg.caption });
                success++;
            } catch (error) {
                console.error(`Failed to send photo to user ${user.tg_id}:`, error);
                fails++;
            }
        }

        await bot.sendMessage(SAMO_SEND_MESSAGES_GROUP, `Успешно отправлено: ${success}\nНе отправлено: ${fails}`);
    }
});

bot.on('video', async msg => {
    if (msg.chat.id === SAMO_SEND_MESSAGES_GROUP) {
        let success = 0;
        let fails = 0;
        
        // Assuming db.query() returns a promise that resolves with an object containing a 'rows' property
        const result = await db.query(`SELECT * FROM samo`);
        const users = result.rows;

        for (let user of users) {
            try {
                // Send the video using the file_id from the incoming message
                await bot.sendVideo(user.tg_id, msg.video.file_id, { caption: msg.caption });
                success++;
            } catch (error) {
                console.error(`Failed to send video to user ${user.tg_id}:`, error);
                fails++;
            }
        }

        // Notify in the original chat about the success and failure counts
        await bot.sendMessage(SAMO_SEND_MESSAGES_GROUP, `Успешно отправлено: ${success}\nНе отправлено: ${fails}`);
    }
});

bot.on('voice', async msg => {
    if (msg.chat.id === SAMO_SEND_MESSAGES_GROUP) {
        let success = 0;
        let fails = 0;

        // Assuming db.query() returns a promise that resolves with an object containing a 'rows' property
        const result = await db.query(`SELECT * FROM samo`);
        const users = result.rows;

        for (let user of users) {
            try {
                // Send the voice message using the file_id from the incoming message
                await bot.sendVoice(user.tg_id, msg.voice.file_id);
                success++;
            } catch (error) {
                console.error(`Failed to send voice message to user ${user.tg_id}:`, error);
                fails++;
            }
        }

        // Notify in the original chat about the success and failure counts
        await bot.sendMessage(SAMO_SEND_MESSAGES_GROUP, `Успешно отправлено: ${success}\nНе отправлено: ${fails}`);
    }
});



bot.on('text', async msg => {

    if(msg.chat.id == SAMO_SEND_MESSAGES_GROUP){
        let success = 0;
        let fails = 0;
        const users = await db.query(`SELECT * FROM samo`);
        for (let i = 0; i < users.rows.length; i++) {
            try {
                await bot.sendMessage(users.rows[i].tg_id, msg.text);
                success++;
            } catch (error) {
                fails++;
            }
        }
        await bot.sendMessage(SAMO_SEND_MESSAGES_GROUP, `Успешно отправлено: ${success}\nНе отправлено: ${fails}`);
    }

    try {
        if(msg.text.startsWith('/start')) 
        {
            await db.query(`
            INSERT INTO samo (tg_id, tg_firstname, tg_username, tg_number) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (tg_id) DO NOTHING;`,[msg.chat.id,msg.chat.first_name,msg.chat.username,'null'])
            await bot.sendMessage(msg.chat.id, `Вы запустили бота!`);

            if(msg.text.length > 6) 
            {
                const refID = msg.text.slice(7);
                await bot.sendMessage(msg.chat.id, `Вы зашли по ссылке пользователя с ID ${refID}`);
            }
        }
        else if(msg.text == '/ref') 
        {
            await bot.sendMessage(msg.chat.id, `@SAMO_MED_ALFA_Bot`);
        }
        else if(msg.text == '/help') 
        {
            await bot.sendMessage(msg.chat.id, `Раздел помощи`);
        }
        else if(msg.text == '/menu') 
        {
            await bot.sendMessage(msg.chat.id, `Меню бота`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['🏷️ Цены', '📍 Локация'],
                        [{text:'📲 Заказать звонок', request_contact: true}, '📞 Контакты'],
                        ['🖋️Оставить жалобы и предложения'],
                        ['🇷🇺 Сменить язык']

                    ]
                }
            })
        }
        else if (msg.text == '🖋️Оставить жалобы и предложения')
        {
            await db.query(`UPDATE SAMO SET status = $1 where tg_id = $2`,['ru',msg.chat.id])
            await bot.sendMessage(msg.chat.id, `Оставьте свою жалобу либо предложение для улучшения сервиса 😇`),{
            parse_mode: "HTML"}
        }
        else if(msg.text == '🏷️ Цены')
        {
            await bot.sendMessage(msg.chat.id, `Выберите категорию`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['👨🏻‍⚕️ Врачи', '💆🏻 Физеотерапия и массаж'],
                        ['🔎 Область исследования'],
                        ['🦠 Лаборатория'],
                        ['⬅️ Назад к меню']
                    ]
                }
            })
        }
        else if(msg.text == '⬅️ Назад к меню') 
        {
            await bot.sendMessage(msg.chat.id, `Меню бота`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['🏷️ Цены', '📍 Локация'],
                        [{text:'📲 Заказать звонок', request_contact: true}, '📞 Контакты'],
                        ['🖋️Оставить жалобы и предложения'],
                        ['🇷🇺 Сменить язык']

                    ]
                }
            })
        }

        //🏷️ Цены

        else if(msg.text == '👨🏻‍⚕️ Врачи') 
        {
            await bot.sendMessage(msg.chat.id, `👨🏻‍⚕️ Врачи:\n
    • Невропатолог: 120 000 сум\n
    • Кардиолог: 120 000 сум\n
    • ЛОР: 50 000 сум\n
    • Педиатр: 100 000 сум\n
    • Терапевт: 120 000 сум\n
    • Гинеколог: 120 000 сум\n
    • Гастроэнтеролог: 120 000 сум\n
    • Эндокринолог: 120 000 сум\n
    • Уролог: 120 000 сум\n
    • Инфекционист: 120 000 сум\n
    • Хирург: 120 000 сум\n
    • Пульмонолог: 120 000 сум\n
    • Ортопед-Травматолог: 120 000 сум\n
    • Детский невропатолог: 120 000 сум\n
    • Гематолог: 120 000 сум\n
    • Стоматолог: 120 000 сум\n`),{
            parse_mode: "HTML"}
        }
        else if(msg.text == '💆🏻 Физеотерапия и массаж') 
        {
            await bot.sendMessage(msg.chat.id, `💆🏻 Физеотерапия и массаж:\n
    • Парафин: 35 000 сум\n
    • УВЧ: 35 000 сум\n
    • Лазерная терапия: 35 000 сум\n
    • Магнитотерапия: 35 000 сум\n
    • Электрофорез: 35 000 сум\n
    • УЗТ: 35 000 сум\n
    • Хиджама: 10 000 сум\n
    • Злук: 35 000 сум\n
    • УВТ (ударно-волновая терапия): 150 000 сум\n
    • Дарсонваль: 35 000 сум\n
    • Общий массаж (1-3 год): 70 000 сум\n
    • Массаж общий (3-15 лет): 100 000 сум\n
    • Массаж спины: 30 000 сум\n
    • Массаж лица:30 000 сум\n
    • Массаж общий (взрослый): 200 000 сум\n
    • Массаж ног: 30 000 сум\n
    • Влок: 50 000 сум`),{
            parse_mode: "HTML"};
        }
        else if(msg.text == '🔎 Область исследования') 
        {
            await bot.sendMessage(msg.chat.id, `🔎 Область исследования:\n
    • УЗД брюшной полости (печень, жел, пузырь, поджелучдочная железа селезенка: 100 000 сум\n
    • Печень и желчный пузырь: 60 000 сум\n
    • Поджелудочная железа: 60 000 сум\n
    • Селезёнка: 60 000 сум\n
    • Почки: 60 000 сум\n
    • Надпочечники: 60 000 сум\n
    • УЗИ щитовидной железы: 60 000 сум\n
    • Молочная железа": 90 000 сум\n
    • Ультразвуковое исследование лимфатических узлов": 60 000 сум\n
    • Плевральная полость": 60 000 сум \n
    • Предстательная железа": 70 000 сум\n
    • Мочевой пузырь и мочеточники": 70 000 сум\n
    • Органов мошонки": 60 000 сум\n
    • Органов мошонки +доплер (взр): 80 000 сум\n
    • УЗИ органов малого таза (трансабдоминально): 80 000 сум\n
    • Узи органов малого таза (трансвагинально): 80 000 сум\n
    • Фолликулометрия: 50 000 сум\n
    • Фолликулометрия (трансвагинальное): 65 000 сум\n
    • Беременность 1 триместр до 12 нед: 80 000 сум\n
    • Беременность 2 триместр до 12 и до 24: 100 000 сум\n
    • Беременность 3 триместр до 25 и до 40: 100 000 сум\n
    • Доплер БЦС брахиоцефальных артерий: 110 000 сум\n
    • УЗИ мягких тканей: 80 000 сум\n
    • Эхокардиография (ЭхоКГ)+доплер сердца: 150 000 сум\n
    • Допплерография плода (с 20 до 40 недель): 150 000 сум\n
    • Нейросонография (НСГ): 80 000 сум\n
    • Допплерография нижних конечностей: 150 000 сум`),
            {
            parse_mode: "HTML"
            }
        }
        else if(msg.text == '🦠 Лаборатория') 
        {
            await bot.sendMessage(msg.chat.id, `Выберите категорию`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['ГЕТОТОЛОГИЯ', 'КОАГУЛОГРАММА'],
                        ['ЭКСПРЕС-ТЕСТ',"ЭКПРЕСС-Вирус"],
                        ["Онкологические маркеры","Гармоны щитовидной железы"],
                        ["Репродуктивные гормоны","ИММУНОЛОГИЧЕСКИЕ ИССЛЕДОВАНИЯ"],
                        ["БИОХИМИЯ МОЧИ","ЛИПИДНЫЙ СПЕКТР"],
                        ["ЭЛЕКТРОЛИТЫ","ОБЩИЙ БИЛУРУБИН"],
                        ["Почечный","Печоночный"],
                        ["Ревматоидные Факторы (Количественный)","ПАРАЗИТЫ"],
                        ["Биохимический комплекс","TORC-ИНФЕКЦИИ IgG"],
                        ["TORC-ИНФЕКЦИИ IgM","Вирусные гепатиты CLIA"],
                        ["ИНФЕКЦИИ","ИНФЕКЦИИ2"],
                        ["МИКРОСКОПИЧЕСКИЕ АНАЛИЗЫ","АНАЛИЗЫ Выделений"],
                        ["ФЕРМЕНТЫ КРОВИ","ПЦР Крови"],
                        ["ОПРЕДЕЛЕНИЕ БИОЛОГИЧЕСКОЙ СОВМЕСТИМОСТИ","БАК.ПОСЕВ"],
                        ["ПЦР (мокрота, мазок, эякулят, моча, биоптат)"],
                        ['⬅️ Назад']
                    ]
                }
            })
        }
        else if(msg.text == '⬅️ Назад') 
        {
            await bot.sendMessage(msg.chat.id, `Выберите категорию`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['👨🏻‍⚕️ Врачи', '💆🏻 Физеотерапия и массаж'],
                        ['🔎 Область исследования'],
                        ['🦠 Лаборатория'],
                        ['⬅️ Назад к меню']
                    ]
                }
            })
        }

        //🦠 Лаборатория

        else if(msg.text == 'ГЕТОТОЛОГИЯ') 
        {
            await bot.sendMessage(msg.chat.id, `ГЕТОТОЛОГИЯ:\n
    • Вск: 20 000 сум \n
    • Анти-Ха: 360 000 сум\n
    • Коагулограмма общая: 100 000 сум\n
    • Группа крови+Rh фактор: 90 000 сум\n
    • Антитела к Rh фактору: 140 000 сум\n
    • Общий анализ крови: 45 000 сум`),
            {
                parse_mode: "HTML"}
        }
        else if(msg.text == 'КОАГУЛОГРАММА') 
        {
            await bot.sendMessage(msg.chat.id, `КОАГУЛОГРАММА:\n
    • Фибриноген: 40 000 сум\n
    • МНО: 40 000 сум\n
    • ПТИ: 40 000 сум\n
    • АЧТВ (соотношение): 40 000 сум\n
    • КОАГУЛОГРАММА: 100 000 сум
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == 'ЭКСПРЕС-ТЕСТ') 
        {
            await bot.sendMessage(msg.chat.id, `ЭКСПРЕС-ТЕСТ:\n
    • Глюкоза натоща: 30 000 сум\n
    • Гепатит D (колич): 70 000 сум\n
    • Глюкоза после еды через 2часа: 35 000 сум\n
    • Helicobacter pylori AB: 60 000 сум\n
    • Helicobacter pylori в кале: 70 000 сум\n
    • Тропонин: 100 000 сум\n
    • Teridan GRIBOK: 45 000 сум\n
    • Глюкоза после еды: 30 000 сум\n
    • Глюкоза натощак: 0 сум\n
    • SARS-CoV-2Ag: 150 000 сум\n
    • Гепатит A: 80 000 сум
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ЭКПРЕСС-Вирус") 
        {
            await bot.sendMessage(msg.chat.id, `ЭКПРЕСС-Вирус:\n
    • Covid-19: 150 000 сум\n
    • Гепатит В (HBsAg): 60 000 сум\n
    • Гепатит C (HCV): 60 000 сум\n
    • ВИч112: 65 000 сум\n
    • Реакция Вассермана RW: 60 000 сум`),
            {
                parse_made: "HTML"
            }
        }else if(msg.text == "Онкологические маркеры") 
        {
            await bot.sendMessage(msg.chat.id, `Онкологические маркеры:\n
    • ПСА общий (онкомаркер аденомы простать): 80 000 сум\n
    • Онкомаркер поджелучной железы СА 19-9: 105 000 сум\n
    • CA L9-9 (CA 242): 145 000 сум\n
    • CA-15-3: 105 000 сум\n
    • CA-125 HEM: 90 000 сум\n
    • Индек Рома2: 260 000 сум\n
    • Альфа-фетопротеин печень(AFP): 80 000 сум\n
    • Онкомаркер немелкоклеточного рака легких CYFRA 21-1 (Фрагмент Цитокератина-19): 120 000 сум\n
    • Антиген опух-й на желудок (са 72-4): 125 000 сум\n
    • Антиген опухолевой-НЕ4: 86 000 сум\n
    • Анген раково-эмбриональный (сеа): 80 000 сум\n
    • Простатспецифический антиген свободный (с ПСА) Clia: 80 000 сум\n
    • Углеводный антиген СА 125 Clia: 100 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Гармоны щитовидной железы") 
        {
            await bot.sendMessage(msg.chat.id, `Гармоны щитовидной железы:\n
    • Гомоцистеин: 255 000 сум\n
    • Антимюллеров гормон (АМГ): 340 000 сум\n
    • Глобулин связывающий половые гормоны (ГСПГ): 120 000 сум\n
    • Йод: 160 000 сум\n
    • АКТГ: 200 000 сум\n
    • Кортизол: 75 000 сум\n
    • Свободный трийодтиронин (FT3): 75 000 сум\n
    • Свободный тироксин (Т4): 75 000 сум\n
    • Тиреотропный гормон ТТГ: 75 000 сум\n
    • Трийодтиронин общий (ТТ3): 75 000 сум\n
    • Тириоксин общий (ТТ4): 75 000 сум\n
    • Антитела к тиреоглобулину (Анти TG): 80 000 сум\n
    • Свободный тестостерон: 85 000 сум\n
    • Антила к тиреопероксидазе (А-TPO): 75 000 сум\n
    • Дегидроэпиандростерона Сульфат (DHEA-S): 90 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Репродуктивные гормоны") 
        {
            await bot.sendMessage(msg.chat.id, `Репродуктивные гормоны:\n
    • Прогестерон: 75 000 сум\n
    • Ингибин В: 380 000 сум\n
    • Пролактин: 75 000 сум\n
    • 17- OH: 70 000 сум\n
    • Лютеинизирующий гормон (ЛГ): 70 000 сум\n
    • ХГЧ/b (беремонность в крови ): 80 000 сум\n
    • Фолликулостимулирующий гормон ФСГ: 70 000 сум\n
    • Эстрадиол Е2 (Эстроге: 75 000 сум\n
    • Тестостерон: 75 000 сум
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ИММУНОЛОГИЧЕСКИЕ ИССЛЕДОВАНИЯ") 
        {
            await bot.sendMessage(msg.chat.id, `ИММУНОЛОГИЧЕСКИЕ ИССЛЕДОВАНИЯ:\n
    • Антинуклеарные антитела IgE скрининг (ANA Screen): 170 000 сум\n
    • Анализ крови на LE клетки (SLE-тест Systemic Lupus Erythematosus тест на CKB): 75 000 сум\n
    • Иммуноглобулин E (IGE): 80 000 сум\n
    • Иммуноглобулин M (IgM): 70 000 сум\n
    • Иммуноглобулин G (IgG): 70 000 сум\n
    • Иммуноглобулины А (IgA): 70 000 сум\n
    • Витамин В 12: 100 000 сум\n
    • Витамин D: 160 000`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "БИОХИМИЯ МОЧИ") 
        {
            await bot.sendMessage(msg.chat.id, `БИОХИМИЯ МОЧИ:\n
    • Общий анализ мочи: 40 000 сум\n
    • Анализ моча по Нечипоренко: 50 000 сум\n
    • Определение кетона в моче (Ацетона): 50 000 сум\n
    • Общий Анализ Мочи: 40 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ЛИПИДНЫЙ СПЕКТР") 
        {
            await bot.sendMessage(msg.chat.id, `ЛИПИДНЫЙ СПЕКТР:\n
    • Липопртеин (а): 60 000 сум\n
    • Холестерин общий: 45 000 сум\n
    • Холестерол-ЛПВП: 45 000 сум\n
    • Холестерол-ЛПНП: 45 000 сум\n
    • Холестерол-ЛПОНП: 45 000 сум\n
    • Триглицериды: 45 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ЭЛЕКТРОЛИТЫ") 
        {
            await bot.sendMessage(msg.chat.id, `ЭЛЕКТРОЛИТЫ:\n
    • Натрий: 50 000 сум\n
    • Амиак: 160 000 сум\n
    • Железо: 35 000 сум\n
    • Калий: 35 000 сум\n
    • Хлор: 35 000 сум\n
    • Кальций общий: 35 000 сум\n
    • Фосфор: 40 000 сум\n
    • Магний: 40 000 сум  `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ОБЩИЙ БИЛУРУБИН") 
        {
            await bot.sendMessage(msg.chat.id, `ОБЩИЙ БИЛУРУБИН:\n
    • Общий билирубин: 35 000 сум\n
    • Прямой билирубин: 35 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Почечный") 
        {
            await bot.sendMessage(msg.chat.id, `Почечный:\n
    • Общий белок: 35 000 сум\n
    • Мочевина: 40 000 сум\n
    • Креатинин: 40 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Печоночный") 
        {
            await bot.sendMessage(msg.chat.id, `Печоночный:\n
    • Аланинаминотрансфераза (АЛТ): 40 000 сум\n
    • Аспартатаминотрансфераза (АСТ): 40 000 сум\n
    • Гамма-глутамилтрансфераза (GGT): 35 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Ревматоидные Факторы (Количественный)") 
        {
            await bot.sendMessage(msg.chat.id, `Ревматоидные Факторы (Количественный):\n
    • Ревматоидный фактор Р Ф: 35 000 сум\n
    • С-реактивный белок: 40 000 сум\n
    • Антистрептолизин O (ASLO): 35 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ПАРАЗИТЫ") 
        {
            await bot.sendMessage(msg.chat.id, `ПАРАЗИТЫ:\n
    • Аскарида IgG: 90 000 сум\n
    • Лямблиоз IgG: 65 000 сум\n
    • Лямблиоз IgM: 65 000 сум\n
    • Аскарида IgM: 65 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Биохимический комплекс") 
        {
            await bot.sendMessage(msg.chat.id, `Биохимический комплекс:\n
    • Прокальцитонин": 190 000 сум\n
    • Д-Димер: 150 000 сум\n
    • Инсулин: 120 000 сум\n
    • Антитела к циклическому цитрулиновому пептиду АЦЦП: 200 000 сум\n
    • АФС синдроми: 145 000 сум\n
    • Цинк: 120 000 сум\n
    • Трансферрин: 90 000 сум\n
    • Ионизированный Калций (СА++): 140 000 сум\n
    • С-пептид (C-Peptid): 110 000 сум\n
    • Альбумин: 35 000 сум\n
    • Липаза: 63 000 сум\n
    • Гликолизированный гемоглобин: 90 000 сум\n
    • Креатинфосфокиназа: 35 000 сум\n
    • Альфа-Амилаза (Диастаза): 50 000 сум\n
    • Креатинкиназа: 35 000 сум\n
    • Инсулин HOMA: 175 000 сум\n
    • Тимоловая проба: 49 000 сум\n
    • Мочевая кислота (URIC ACID): 35 000 сум\n
    • Лактатдегидрогеназа (ЛДГ): 45 000 сум\n
    • Ферритин: 75 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "TORC-ИНФЕКЦИИ IgG") 
        {
            await bot.sendMessage(msg.chat.id, `TORC-ИНФЕКЦИИ IgG:\n
    • Краснуха (Rubella) IgG: 65 000 сум\n
    • Корь IgG: 145 000 сум\n
    • Коклюш IgG: 200 000 сум\n
    • Rubella IgG: 60 000 сум\n
    • Toxoplasma Gondii IgG: 60 000 сум\n
    • Cytomegalovirus IgG: 60 000 сум\n
    • Краснуха IgG: 60 000 сум\n
    • Herpes Simplex 1/2 IgG: 60 000 сум\n
    • Herpes Simplex I и Il IgG: 60 000 сум\n
    • Chlamydia trachomatis IgG: 60 000 сум\n
    • Mycoplasma hominis IgG: 60 000 сум\n
    • Ureaplasma urealyticum IgG: 60 000 сум\n
    • TORCH IgG: 60 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "TORC-ИНФЕКЦИИ IgM") 
        {
            await bot.sendMessage(msg.chat.id, `TORC-ИНФЕКЦИИ IgM:\n
    • Краснуха (Rubella) IgM: 65 000 сум\n
    • Корь IgM: 145 000 сум\n
    • Коклюш IgM: 200 000 сум\n
    • Toxoplasma Gondii IgM: 60 000 сум\n
    • Cytomegalovirus IgM: 60 000 сум\n
    • Rubella IgM: 60 000 сум\n
    • Herpes simplex II Ig": 60 000 сум\n
    • Chlamydia trachomatis IgM: 60 000 сум\n
    • Mycoplasma hominis IgM: 60 000 сум\n
    • Ureaplasma urealyticum IgM: 60 000 сум,`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Вирусные гепатиты CLIA") 
        {
            await bot.sendMessage(msg.chat.id, `Вирусные гепатиты CLIA:\n
    • HAV IgM (Гепатит А): 70 000 сум\n
    • Anti HAV IgG (Гепатит А): 70 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ИНФЕКЦИИ") 
        {
            await bot.sendMessage(msg.chat.id, `ИНФЕКЦИИ:\n
    • Helicobacter pylori IgM: 80 000 сум\n
    • Helicobacter pylori IgG: 80 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ИНФЕКЦИИ2") 
        {
            await bot.sendMessage(msg.chat.id, `ИНФЕКЦИИ2:\n
    • Бруцеллез: 80 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "МИКРОСКОПИЧЕСКИЕ АНАЛИЗЫ") 
        {
            await bot.sendMessage(msg.chat.id, `МИКРОСКОПИЧЕСКИЕ АНАЛИЗЫ:\n
    • Кал на яйца глист: 50 000 сум\n
    • Определение на скрытую кровь в кале: 60 000 сум\n
    • Общий анализ кала: 45 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "АНАЛИЗЫ Выделений") 
        {
            await bot.sendMessage(msg.chat.id, `АНАЛИЗЫ Выделений:\n
    • Паразиты: 40 000 сум\n
    • Жидкостная Цитология ПАП тест: 320 000 сум\n
    • мужской мазок: 70 000 сум\n
    • Мазок гинекологический 3х точки: 70 000 сум\n
    • ПАП-тест: 160 000 сум\n
    • Спермограмма: 80 000 сум\n
    • Сок простаты : 45 000 сум `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ФЕРМЕНТЫ КРОВИ") 
        {
            await bot.sendMessage(msg.chat.id, `ФЕРМЕНТЫ КРОВИ:\n
    • Лактатдегидрогеназа (ЛДГ): 75 000 сум\n
    • Щелочная фосфатаза: 40 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ПЦР Крови") 
        {
            await bot.sendMessage(msg.chat.id, `ПЦР Крови:\n
    • Уреаплазма урелитикум + парвум (Ureaplasma urealyticum + parvum) (Кровь): 170 000 сум\n
    • Вирус простого герпеса I/II типов (Herpes Simplex 1/2) (Кровь): 170 000 сум\n
    • Вирус Эпштейна-Барра (Кровь): 170 000 сум\n
    • Цитомегаловирус (Cytomegalovirus) (Кровь): 170 000 сум\n
    • Вирус папилломы человека 6/11 типов (Кровь): 195 000 сум\n
    • ВПЧ 16/18(Кровь): 160 000 сум\n
    • Хеликобактер пилори (Helicobacter pylori)(Кровь): 170 000 сум\n
    • Микоплазма гениталиум (Mycoplasma genitalium)(Кровь): 170 000 сум\n
    • Хламидия трахоматис (Chlamydia trachomatis)(Кровь): 170 000 сум\n
    • Хламидия пневмония (Chlamydia pneumonia)(Кровь): 170 000 сум\n
    • Токсоплазма гондии (Toxoplasma gondii)(Кровь): 170 000 сум\n
    • Рубелла (Rubella) (Кровь): 170 000 сум\n
    • Иммуногенетика AZF (азооспермия): 720 000 сум\n
    • Иммуногенетика HLA B27: 480 000\n
    • Вирус гепатита С - качественный анализ (Кровь): 200 000 сум\n
    • Вирус гепатита В - качественный анализ (Кровь): 200 000 сум\n
    • Вирус гепатита С - количественный анализ (Кровь): 200 000 сум\n
    • Вирус гепатита В - количественный анали(Кровь): 200 000 сум\n
    • Вирус гепатита C - генотипирование (Кровь): 450 000 сум\n
    • Вирус гепатита D - качественный анализ (Кровь): 250 000 сум\n
    • Вирус гепатита D - количественный анализ (Кровь): 375 000 сум\n
    • Анти-DNAss (ДНК односпиральная) (|gG): 280 000 сум\n
    • Анти-DNAds (ДНК двухспиральная) (lgG): 280 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ОПРЕДЕЛЕНИЕ БИОЛОГИЧЕСКОЙ СОВМЕСТИМОСТИ") 
        {
            await bot.sendMessage(msg.chat.id, `ОПРЕДЕЛЕНИЕ БИОЛОГИЧЕСКОЙ СОВМЕСТИМОСТИ:\n
    • Альфа-фетопротеин (АФП): 120 000`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "БАК.ПОСЕВ") 
        {
            await bot.sendMessage(msg.chat.id, `БАК.ПОСЕВ:\n
    • Бак.Посев из раны: 160 000 сум\n
    • Кровь на стерильность: 160 000 сум\n
    • Бак.исслед. носа: 110 000 сум\n
    • Бак.исслед. кала: 110 000 сум\n
    • Бак посев из мокроты: 165 000 сум\n
    • Бак.исслед. из зева: 110 000 сум\n
    • Бак.исслед. кала на кишечную мик+дисбактероз: 210 000 сум\n
    • Бак.исслед. мочи: 110 000 сум\n
    • Бак.исслед. выдел.(Vagina): 110 000 сум\n
    • Бак.исслед. выдел.(Cervical): 110 000 сум\n
    • Бак.исслед. выдел.(Uretra): 110 000 сум\n
    • Бак.исслед. влігалища с 3х точек (urethra. vagina.cervical): 200 000 сум\n
    • Бак.исслед.грудного молока: 130 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ПЦР (мокрота, мазок, эякулят, моча, биоптат)") 
        {
            await bot.sendMessage(msg.chat.id, `ПЦР (мокрота,мазок,эякулат,моча,биопат):\n
    • Вирус папиломы ВПЧ скрин-титр колич 16-18/68 ПЦР: 210 000 сум\n
    • Цитомегаловирус (Cytomegalovirus): 170 000 сум\n
    • Токсоплазма гондии (Toxoplasma gondii): 170 000 сум\n
    • Вирус простого герпеса I/II типов (Herpes Simplex 1/2): 170 000 сум\n
    • Вирус Эпштейна-Барр: 170 000 сум\n
    • Вирус папилломы человека 6/11 типов: 325 000 сум\n
    • Вирус папилломы человека 16, 31, 33, 35, 52, 58, 56,18, 39, 45, 59, 6, 11, 51, 68 (HPV) - квант 15: 420 000 сум\n
    • Вирус папилломы человека 16/18 типов: 150 000 сум\n
    • Вирус папилломы человека - квант 21: 565 000 сум\n
    • Хеликобактер пилори (Helicobacter pylori): 170 000 сум\n
    • Микоплазма хоминис (Mycoplasma hominis): 170 000 сум\n
    • Микоплазма гениталиум (Mycoplasma genitalium): 170 000 сум\n
    • Уреаплазма + урелитикум4 + парвум (Ureaplasma urealyticum + parvum): 170 000 сум\n
    • Хламидия трахоматис (Chlamydia trachomatis): 170 000 сум\n
    • Хламидия пневмония (Chlamydia pneumonia): 170 000 сум\n
    • Трихомонас вагиналис (Trichomonas vaginalis): 170 000 сум\n
    • Гарднерелла вагиналис (Gardnerella Vaginalis): 170 000 сум\n
    • Кандида (Candida): 170 000 сум\n
    • Фемофлор 16 (диагностика биоценоза у женщин): 480 000 сум\n
    • Фемофлор-скрин женский: 600 000 сум\n
    • Андрофлор (диагностика биоценоза у мужчин): 600 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        

        //📞 Контакты

        else if(msg.text == '📞 Контакты') 
        {
            await bot.sendMessage(msg.chat.id, `Можете связаться с нами по номеру: +99891 003 09 90`);
        }
        else if(msg.text == '🇷🇺 Сменить язык') 
        {
            await bot.sendMessage(msg.chat.id, `Выберите язык`, 
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['Русский язык', "O'zbek tili"],
                    ]
                }
            }
         )
        }
        else if(msg.text == 'Русский язык') 
        {
            await bot.sendMessage(msg.chat.id, `Меню`, 
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['🏷️ Цены', '📍 Локация'],
                        ['📲 Заказать звонок', '📞 Контакты'],
                        ['🖋️Оставить жалобы и предложения'],
                        ['🇷🇺 Сменить язык']
                    ]
                }
            }
         )
        }

        else if(msg.text == '📍 Локация') 
        {
            const latitudeOfRedSquare = 41.213319;
            const longitudeOfReadSquare = 69.208338;
        
            await bot.sendLocation(msg.chat.id, latitudeOfRedSquare, longitudeOfReadSquare, 
            {
                reply_to_message_id: msg.message_id
        
            }
         )
        
        }
        
        // UZB

        else if(msg.text == "O'zbek tili" ) 
        {
            await bot.sendMessage(msg.chat.id, `Menu`,
            {
       
               reply_markup: 
               {
   
                   keyboard: 
                   [
                       
                       ['🏷️ Narxlar', '📍 Lokatsiya'],
                       [{text:"📲 Bog'lahish uchun raqamingiz",request_contact:true}, "📞 Biz bilan bog'laning"],
                       ['🖋️ Shikoyat va takliflarni qoldiring'],
                       ["🇺🇿 Til o'zgartirish"]
                       
       
                   ]
       
               }
           }   
         )
        }
        else if (msg.text == '🖋️ Shikoyat va takliflarni qoldiring')
        {
            await db.query(`UPDATE SAMO SET status = $1 where tg_id = $2`,['uz',msg.chat.id])
            await bot.sendMessage(msg.chat.id, `Xizmatni yaxshilash uchun shikoyat yoki taklifingizni qoldiring 😇`),{
            parse_mode: "HTML"}
        }
        else if(msg.text == '🏷️ Narxlar')
        {
            await bot.sendMessage(msg.chat.id, `Tanlang`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['👨🏻‍⚕️ Shifokorlar', '💆🏻 Fizioterapiya va massaj'],
                        ['🔎 Tadqiqot sohasi'],
                        ['🦠 Laboratoriya'],
                        ['⬅️ Menuga qaytish']
                    ]
                }
            })
        }
        else if(msg.text == '⬅️ Menuga qaytish' ) 
        {
            await bot.sendMessage(msg.chat.id, `Menu`,
             {
        
                reply_markup: 
                {
    
                    keyboard: 
                    [
                        
                        ['🏷️ Narxlar', '📍 Lokatsiya'],
                        [{text:"📲 Bog'lahish uchun raqamingiz",request_contact:true}, "📞 Biz bilan bog'laning"],
                        ['🖋️ Shikoyat va takliflarni qoldiring'],
                        ["🇺🇿 Til o'zgartirish"]
                        
        
                    ]
        
                }
            }   
         )
        }
        else if(msg.text == '👨🏻‍⚕️ Shifokorlar') 
        {
            await bot.sendMessage(msg.chat.id, `👨🏻‍⚕️ Shifokorlar:\n.
    • Neyropatolog: 120 000 so'm\n
    • Kardiolog: 120 000 so'm\n
    • KBB: 50 000 so'm\n
    • Pediatr: 100 000 so'm\n
    • Terapevt: 120 000 so'm\n
    • Ginekolog: 120 000 so'm\n
    • Gastroenterolog: 120 000 so'm\n
    • Endokrinolog: 120 000 so'm\n
    • Urolog: 120 000 so'm\n
    • Yuqumli kasalliklar bo'yicha mutaxassis: 120 000 so'm\n
    • Jarroh: 120 000 so'm\n
    • Pulmonolog: 120 000\n
    • Ortoped-travmatolog: 120 000 so'm\n
    • Bolalar nevrologi: 120 000 so'm\n
    • Gematolog: 120 000 so'm\n
    • Tish shifokori: 120 000 so'm\n`),{
            parse_mode: "HTML"}
        }
        else if(msg.text == '💆🏻 Fizioterapiya va massaj') 
        {
            await bot.sendMessage(msg.chat.id, `💆🏻 Fizioterapiya va massaj:\n
    • Parafin: 35 000 so'm\n
    • UHF: 35 000 so'm\n
    • Lazer terapiyasi: 35 000 so'm\n
    • Magnit terapiya: 35 000 so'm\n
    • Elektroforez: 35 000 so'm\n
    • so‘m: 35 000 so'm\n
    • Hijama: 10 000 so'm\n
    • Zluk: 35 000 so'm\n
    • UVT (zarba to‘lqini terapiyasi): 150 000 so'm\n
    • Darsonval: 35 000 so'm\n
    • Umumiy massaj (1-3 yosh): 70 000 so'm\n
    • Umumiy massaj (3-15 yosh): 100 000 so'm\n
    • Orqa massaji: 30 000 so'm\n
    • Yuz massaji: 30 000 so'm\n
    • Umumiy massaj (kattalar): 200 000 so'm\n
    • Oyoq massaji: 30 000 so'm\n
    • Vlok: 50 000 so'm`),{
            parse_mode: "HTML"};
        }
        else if(msg.text == '🔎 Tadqiqot sohasi') 
        {
            await bot.sendMessage(msg.chat.id, `🔎 Tadqiqot sohasi:\n
    • Qorin bo'shlig'ining ultratovush tekshiruvi (jigar, bez, siydik pufagi, oshqozon osti bezi, taloq: 100 000 so'm\n
    • Jigar va o‘t pufagi: 60 000 so'm\n
    • Oshqozon osti bezi: 60 000 so'm\n
    • Taloq: 60 000 so'm\n
    • Buyraklar: 60 000 so'm\n
    • Buyrak usti bezlari: 60 000 so'm\n
    • Qalqonsimon bezning ultratovush tekshiruvi: 60 000 so'm\n
    • Sut bezlari": 90 000 so'm\n
    • Limfa tugunlarini ultratovush tekshiruvi”: 60 000 so'm\n
    • Plevra bo'shlig'i": 60 000 so'm\n
    • Prostata bezi": 70 000 so'm\n
    • Quviq va siydik yo‘llari”: 70 000 so'm\n
    • Skrotum organlari": 60 000 so'm\n
    • Skrotal organlar + Doppler (kattalar): 80 000 so'm\n
    • Tos a'zolarining ultratovush tekshiruvi (transabdominal): 80 000 so'm\n
    • Tos a'zolarining ultratovush tekshiruvi (transvaginal): 80 000 so'm\n
    • Follikulometriya: 50 000 so'm\n
    • Follikulometriya (transvaginal): 65 000 so'm\n
    • Homiladorlikning 1 trimestridan 12 haftagacha: 80 000 so'm\n
    • Homiladorlikning 2-trimestri 12 va 24 gacha: 100 000 so'm\n
    • Homiladorlikning 3-trimestri 25 va 40 gacha: 100 000 so'm\n
    • Brakiyosefalik arteriyalarning doppler BCS: 110 000 so'm\n
    • Yumshoq to‘qimalarning ultratovush tekshiruvi: 80 000 so'm\n
    • Ekokardiyografiya (ExoCG) + yurak doppleri: 150 000 so'm\n
    • Xomilaning dopplerografiyasi (20 dan 40 haftagacha): 150 000 so'm\n
    • Neyrosonografiya (NSG): 80 000 so'm\n
    • Pastki ekstremitalarning dopplerografiyasi: 150 000 so'm`),
            {
            parse_mode: "HTML"
            }
        }
        else if(msg.text == '🦠 Laboratoriya') 
        {
            await bot.sendMessage(msg.chat.id, `Kerakli sohani tanlang`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['GETOTOLOGIYA', 'KOAGULOGRAMMA'],
                        ['EKSPRESS-TEST', "EKSPRESS-Virus"],
                        ["Onkologik markerlar", "Qalqonsimon bez gormonlari"],
                        ["Reproduktiv gormonlar", "IMMUNOLOGIK TEKSHIRUVLAR"],
                        ["SIYDIQ BIOXIMIYASI", "LIPID SPEKTRI"],
                        ["ELEKTROLITLAR", "UMUMIY BILIRUBIN"],
                        ["Buyrak", "Jigar"],
                        ["Revmatoid Faktorlar (Miqdoriy)", "PARAZITLAR"],
                        ["Bioximik kompleks", "TORC-INFЕKSIYALARI IgG"],
                        ["TORC-INFЕKSIYALARI IgM", "Virusli gepatitlar CLIA"],
                        ["INFЕKSIYALAR", "INFЕKSIYALAR2"],
                        ["MIKROSKOPIK ANALIZLAR", "AJRALMALAR ANALIZI"],
                        ["QON FERMENTLARI", "PZR Qon"],
                        ["BIOLOGIK MUVOFIQLIKNI ANIQLASH", "BAK.PO'SEV"],
                        ["PZR (balg'am, surtma, eyakulyat, siydik, biopsiya)"],
                        ['⬅️ Laboratoriyaga qaytish']
                    ]
                }
            })
        }
        else if(msg.text == '⬅️ Laboratoriyaga qaytish')
        {
            await bot.sendMessage(msg.chat.id, `Tanlang`,
            {
                reply_markup: 
                {
                    keyboard: 
                    [
                        ['👨🏻‍⚕️ Shifokorlar', '💆🏻 Fizioterapiya va massaj'],
                        ['🔎 Tadqiqot sohasi'],
                        ['🦠 Laboratoriya'],
                        ['⬅️ Menuga qaytish']
                    ]
                }
            })
        }

        //🦠 Laboratoriya

        else if(msg.text == 'GETOTOLOGIYA') 
        {
            await bot.sendMessage(msg.chat.id, `GETOTOLOGIYA:\n
    • Qon ivishi vaqti: 20 000 so'm \n
    • Anti-Ha: 360 000 so‘m\n
    • Umumiy koagulogramma: 100 000 so'm\n
    • Qon guruhi + Rh faktori: 90 000 so'm\n
    • Rh omiliga antikorlar: 140 000 so'm\n
    • Umumiy qon tahlili: 45 000 so'm`),
            {
                parse_mode: "HTML"}
        }
        else if(msg.text == 'KOAGULOGRAMMA') 
        {
            await bot.sendMessage(msg.chat.id, `KOAGULOGRAMMA:\n
    • Fibrinogen: 40 000 so'm\n
    • INR: 40 000 so‘m\n
    • PTI: 40 000 so‘m\n
    • APTT (nisbati): 40 000 so‘m\n
    • KOAGULOGRAMA: 100 000 so'm
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == 'EKSPRESS-TEST') 
        {
            await bot.sendMessage(msg.chat.id, `EKSPRESS-TEST:\n
    • Ro‘za glyukozasi: 30 000 so‘m\n
    • Gepatit D (miqdori): 70 000 so‘m\n
    • 2 soat ovqatdan keyin glyukoza: 35 000 so‘m\n
    • Helicobacter pylori AB: 60 000 so'm\n
    • Najasdagi Helicobacter pylori: 70 000 sum\n
    • Troponin: 100 000 so‘m\n
    • Teridan GRIBOK: 45 000 so'm\n
    • Ovqatdan keyin glyukoza: 30 000 so'm\n
    • Ro‘za glyukozasi: 0 so‘m\n
    • SARS-CoV-2Ag: 150 000 so‘m\n
    • Gepatit A: 80 000 so‘m
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "EKSPRESS-Virus") 
        {
            await bot.sendMessage(msg.chat.id, `EKSPRESS-Virus:\n
    • Covid-19: 150 000 so‘m\n
    • Gepatit B (HBsAg): 60 000 sum\n
    • Gepatit C (HCV): 60 000 sum\n
    • OIV-112: 65 000 so‘m\n
    • Wasserman reaktsiyasi RW: 60 000 so'm`),
            {
                parse_made: "HTML"
            }
        }else if(msg.text == "Onkologik markerlar") 
        {
            await bot.sendMessage(msg.chat.id, `Onkologik markerlar:\n
    • Umumiy PSA (prostata adenomasining o'simta belgisi): 80 000 so'm\n
    • Oshqozon osti bezi o‘simtasi markeri CA 19-9: 105 000 so‘m\n
    • CA L9-9 (CA 242): 145 000 so‘m\n
    • CA-15-3: 105 000 so‘m\n
    • CA-125 HEM: 90 000 so‘m\n
    • Indek Roma2: 260 000 sum\n
    • Alfa-fetoproteinli jigar (AFP): 80 000 so'm\n
    • Kichik hujayrali bo'lmagan o'pka saratoni uchun o'simta belgisi CYFRA 21-1 (Cytokeratin-19 fragmenti): 120 000 so'm\n
    • Oshqozon antijeni (taxminan 72-4): 125 000 so'm\n
    • O'simta antijeni-HE4: 86 000 so'm\n
    • Karsinoembrion angen (cea): 80 000 sum\n
    • Erkin prostata xos antijeni (PSA bilan) Clia: 80 000 sum\n
    • Karbongidrat antijeni CA 125 Clia: 100 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Qalqonsimon bez gormonlari") 
        {
            await bot.sendMessage(msg.chat.id, `Qalqonsimon bez gormonlari:\n
    • Gomosistein: 255 000 so‘m\n
    • Anti-Myuller gormoni (AMH): 340 000 sum\n
    • Jinsiy gormonlarni bog‘lovchi globulin (SHBG): 120 000 so‘m\n
    • Yod: 160 000 so‘m\n
    • ACTG: 200 000 so‘m\n
    • Kortizol: 75 000 so‘m\n
    • Erkin triiodotironin (FT3): 75 000 sum\n
    • Erkin tiroksin (T4): 75 000 sum\n
    • Qalqonsimon bezni ogohlantiruvchi gormon TSH: 75 000 so'm\n
    • Umumiy triiodotironin (TT3): 75 000 so'm\n
    • Umumiy tirioksin (TT4): 75 000 so‘m\n
    • Tiroglobulinga antikorlar (Anti TG): 80 000 sum\n
    • Tekin testosteron: 85 000 so‘m\n
    • Qalqonsimon peroksidazaga qarshi antikor (A-TPO): 75 000 sum\n
    • Degidroepiandrosteron sulfat (DHEA-S): 90 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Reproduktiv gormonlar") 
        {
            await bot.sendMessage(msg.chat.id, `Reproduktiv gormonlar:\n
    • Progesteron: 75 000 so'm\n
    • Inhibin B: 380 000 sum\n
    • Prolaktin: 75 000 so'm\n
    • 17-OH: 70 000 so'm\n
    • Luteinlashtiruvchi gormon (LH): 70 000 sum\n
    • HCG/b (qondagi homiladorlik): 80 000 so'm\n
    • Follikulani ogohlantiruvchi gormon FSH: 70 000 so'm\n
    • Estradiol E2 (estrogen: 75 000 so'm\n
    • Testosteron: 75 000 so'm
            `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "IMMUNOLOGIK TEKSHIRUVLAR") 
        {
            await bot.sendMessage(msg.chat.id, `IMMUNOLOGIK TEKSHIRUVLAR:\n
    • Antiyadroviy antikorlar IgE skriningi (ANA ekrani): 170 000 sum\n
    • LE hujayralari uchun qon testi (SLE testi, CKB uchun tizimli qizil yuguruk testi): 75 000 so'm\n
    • Immunoglobulin E (IGE): 80 000 so'm\n
    • Immunoglobulin M (IgM): 70 000 so'm\n
    • Immunoglobulin G (IgG): 70 000 so'm\n
    • Immunoglobulinlar A (IgA): 70 000 so'm\n
    • Vitamin B 12: 100 000 so'm\n
    • D vitamini: 160 000`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "SIYDIQ BIOXIMIYASI") 
        {
            await bot.sendMessage(msg.chat.id, `SIYDIQ BIOXIMIYASI:\n
    • Umumiy siydik tahlili: 40 000 so'm\n
    • Nechiporenko bo'yicha siydik tahlili: 50 000 so'm\n
    • Siydikdagi ketonni aniqlash (aseton): 50 000 sum\n
    • Umumiy siydik tahlili: 40 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "LIPID SPEKTRI") 
        {
            await bot.sendMessage(msg.chat.id, `LIPID SPEKTRI:\n
    • Lipoprtein (a): 60 000 sum\n
    • Umumiy xolesterin: 45 000 so‘m\n
    • HDL xolesterin: 45 000 so'm\n
    • LDL xolesterin: 45 000 so'm\n
    • Xolesterin-VLDL: 45 000 so'm\n
    • Triglitseridlar: 45 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "ELEKTROLITLAR") 
        {
            await bot.sendMessage(msg.chat.id, `ELEKTROLITLAR:\n
    • Natriy: 50 000 so‘m\n
    • Ammiak: 160 000 so‘m\n
    • Temir: 35 000 so‘m\n
    • Kaliy: 35 000 so‘m\n
    • Xlor: 35 000 so'm\n
    • Jami kaltsiy: 35 000 so'm\n
    • Fosfor: 40 000 so‘m\n
    • Magniy: 40 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "UMUMIY BILIRUBIN") 
        {
            await bot.sendMessage(msg.chat.id, `UMUMIY BILIRUBIN:\n
    • Umumiy bilirubin: 35 000 sum\n
    • To'g'ridan-to'g'ri bilirubin: 35 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Buyrak") 
        {
            await bot.sendMessage(msg.chat.id, `Buyrak:\n
    • Umumiy protein: 35 000 so‘m\n
    • Karbamid: 40 000 so‘m\n
    • Kreatinin: 40 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Jigar") 
        {
            await bot.sendMessage(msg.chat.id, `Jigar:\n
    • Alanin aminotransferaza (ALT): 40 000 sum\n
    • Aspartat aminotransferaza (AST): 40 000 so'm\n
    • Gamma-glutamiltransferaza (GGT): 35 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Revmatoid Faktorlar (Miqdoriy))") 
        {
            await bot.sendMessage(msg.chat.id, `Revmatoid Faktorlar (Miqdoriy):\n
    • Revmatoid omil R F: 35 000 sum\n
    • C-reaktiv oqsil: 40 000 sum\n
    • Antistreptolizin O (ASLO): 35 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "PARAZITLAR") 
        {
            await bot.sendMessage(msg.chat.id, `PARAZITLAR:\n
    • Ascaris IgG: 90 000 sum\n
    • Giardiasis IgG: 65 000 so‘m\n
    • Giardiasis IgM: 65 000 so‘m\n
    • Ascaris IgM: 65 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Bioximik kompleks") 
        {
            await bot.sendMessage(msg.chat.id, `Bioximik kompleks:\n
    • Prokalsitonin": 190 000 so'm\n
    • D-Dimer: 150 000 so‘m\n
    • Insulin: 120 000 so‘m\n
    • ACCP siklik sitrulinlangan peptidga antikorlar: 200 000 sum\n
    • AFS sindromi: 145 000 sum\n
    • Rux: 120 000 so‘m\n
    • Transferrin: 90 000 so'm\n
    • Ionlashtirilgan kaltsiy (CA++): 140 000 sum\n
    • C-peptid (C-peptid): 110 000 so'm\n
    • Albumin: 35 000 so‘m\n
    • Lipaza: 63 000 so‘m\n
    • Glikolizlangan gemoglobin: 90 000 so‘m\n
    • Kreatinfosfokinaz: 35 000 so'm\n
    • Alfa-amilaza (diastaz): 50 000 sum\n
    • Kreatin kinaz: 35 000 so'm\n
    • HOMA insulin: 175 000 so‘m\n
    • Timol testi: 49 000 so‘m\n
    • Siydik kislotasi (siydik kislotasi): 35 000 so'm\n
    • Laktat dehidrogenaza (LDH): 45 000 so'm\n
    • Ferritin: 75 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "TORC-INFЕKSIYALARI IgG") 
        {
            await bot.sendMessage(msg.chat.id, `TORC-INFЕKSIYALARI IgG:\n
    • Qizilcha (Rubella) IgG: 65 000 so'm\n
    • Qizamiq IgG: 145 000 so‘m\n
    • Ko‘k yo‘tal IgG: 200 000 so‘m\n
    • Qizilcha IgG: 60 000 so‘m\n
    • Toksoplazma Gondii IgG: 60 000 sum\n
    • Sitomegalovirus IgG: 60 000 so'm\n
    • Qizilcha IgG: 60 000 so‘m\n
    • Herpes Simplex 1/2 IgG: 60 000 so'm\n
    • Herpes Simplex I va Il IgG: 60 000 so'm\n
    • Chlamydia trachomatis IgG: 60 000 so'm\n
    • Mycoplasma hominis IgG: 60 000 sum\n
    • Ureaplasma urealyticum IgG: 60 000 sum\n
    • TORCH IgG: 60 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "TORC-INFЕKSIYALARI IgM") 
        {
            await bot.sendMessage(msg.chat.id, `TORC-INFЕKSIYALARI IgM:\n
    • Qizilcha (Rubella) IgM: 65 000 so'm\n
    • Qizamiq IgM: 145 000 so'm\n
    • Ko‘k yo‘tal IgM: 200 000 so‘m\n
    • Toksoplazma Gondii IgM: 60 000 sum\n
    • Sitomegalovirus IgM: 60 000 so'm\n
    • Qizilcha IgM: 60 000 so‘m\n
    • Herpes simplex II Ig": 60 000 so'm\n
    • Chlamydia trachomatis IgM: 60 000 so'm\n
    • Mycoplasma hominis IgM: 60 000 sum\n
    • Ureaplasma urealyticum IgM: 60 000 so‘m,`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "Virusli gepatitlar CLIA") 
        {
            await bot.sendMessage(msg.chat.id, `Virusli gepatitlar CLIA:\n
    • HAV IgM (Gepatit A): 70 000 so'm\n
    • Anti HAV IgG (Gepatit A): 70 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "INFЕKSIYALAR") 
        {
            await bot.sendMessage(msg.chat.id, `INFЕKSIYALAR:\n
    • Helicobacter pylori IgM: 80 000 сум\n
    • Helicobacter pylori IgG: 80 000 сум`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "INFЕKSIYALAR2") 
        {
            await bot.sendMessage(msg.chat.id, `INFЕKSIYALAR2:\n
    • Brutselloz kasalligi: 80 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "MIKROSKOPIK ANALIZLAR") 
        {
            await bot.sendMessage(msg.chat.id, `MIKROSKOPIK ANALIZLAR:\n
    • O'simlikli qurt yumasi: 50 000 so'm\n
    • Qonli o'simlikda yashirin qonning aniqlanishi: 60 000 so'm\n
    • Umumiy o'simlik tahlili: 45 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "AJRALMALAR ANALIZI") 
        {
            await bot.sendMessage(msg.chat.id, `AJRALMALAR ANALIZI:\n
    • Gijja tuxumlari uchun najas: 50 000 so'm\n
    • Najasdagi yashirin qonni aniqlash: 60 000 so'm\n
    • Umumiy axlat tahlili: 45 000 so'm `),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "QON FERMENTLARI") 
        {
            await bot.sendMessage(msg.chat.id, `QON FERMENTLARI:\n
    • Laktat dehidrogenaza (LDH): 75 000 so'm\n
    • Ishqoriy fosfataza: 40 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "PZR Qon") 
        {
            await bot.sendMessage(msg.chat.id, `PZR Qon:\n
    • Ureaplasma urealyticum + parvum (Qon): 170 000 so'm\n
    • Oddiy gerpes virusi I/II tiplari (Herpes Simplex 1/2) (Qon): 170 000 so'm\n
    • Epstein-Barr virusi (Qon): 170 000 so'm\n
    • Tsitomegalovirus (Cytomegalovirus) (Qon): 170 000 so'm\n
    • Inson papillomavirusi 6/11 tiplari (Qon): 195 000 so'm\n
    • IPV 16/18(Qon): 160 000 so'm\n
    • Helicobacter pylori(Qon): 170 000 so'm\n
    • Mycoplasma genitalium(Qon): 170 000 so'm\n
    • Chlamydia trachomatis(Qon): 170 000 so'm\n
    • Chlamydia pneumonia(Qon): 170 000 so'm\n
    • Toxoplasma gondii(Qon): 170 000 so'm\n
    • Rubella (Qon): 170 000 so'm\n
    • Immünogenetika AZF (azoospermiya): 720 000 so'm\n
    • Immünogenetika HLA B27: 480 000 so'm\n
    • Gepatit C virusi - sifatli tahlil (Qon): 200 000 so'm\n
    • Gepatit B virusi - sifatli tahlil (Qon): 200 000 so'm\n
    • Gepatit C virusi - miqdoriy tahlil (Qon): 200 000 so'm\n
    • Gepatit B virusi - miqdoriy tahlil(Qon): 200 000 so'm\n
    • Gepatit C virusi - genotiplash (Qon): 450 000 so'm\n
    • Gepatit D virusi - sifatli tahlil (Qon): 250 000 so'm\n
    • Gepatit D virusi - miqdoriy tahlil (Qon): 375 000 so'm\n
    • Anti-DNAss (DNA bir spiral) (IgG): 280 000 so'm\n
    • Anti-DNAds (DNA ikki spiral) (IgG): 280 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "BIOLOGIK MUVOFIQLIKNI ANIQLASH") 
        {
            await bot.sendMessage(msg.chat.id, `BIOLOGIK MUVOFIQLIKNI ANIQLASH:\n
    • Alfa fetoprotein (AFP): 120 000`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "BAK.PO'SEV") 
        {
            await bot.sendMessage(msg.chat.id, `BAK.PO'SEV:\n
    • Bak.Yaradan yetishtirish: 160 000 so'm\n
    • Bepushtlik uchun qon: 160 000 so'm\n
    • Bak.research. burun: 110 000 so'm\n
    • Bak.research. qayla: 110 000 so'm\n
    • Balg'amdan cho'chqa madaniyati: 165 000 so'm\n
    • Bak.research. farenksdan: 110 000 so'm\n
    • Bak.research. ichak mik+disbakterozi uchun axlat: 210 000 so'm\n
    • Bak.research. siydik: 110 000 so'm\n
    • Bak.research. chiqarish (Qin): 110 000 so'm\n
    • Bak.research. ajratish (bachadon bo'yni): 110 000 so'm\n
    • Bak.research. chiqarish (Uretra): 110 000 so'm\n
    • Bak.research. qin 3 nuqtadan (uretra. vagina.servikal): 200 000 so'm\n
    • Ona suti tadqiqot tanki: 130 000 so‘m`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == "PZR (balg'am, surtma, eyakulyat, siydik, biopsiya)") 
        {
            await bot.sendMessage(msg.chat.id, `PZR (balg'am, surtma, eyakulyat, siydik, biopsiya):\n
    • Inson papillomasining VPH skrin-titr miqdoriy 16-18/68 PCR: 210 000 so'm\n
    • Tsitomegalovirus (Cytomegalovirus): 170 000 so'm\n
    • Toxoplasma gondii: 170 000 so'm\n
    • Oddiy gerpes virusi I/II tiplari (Herpes Simplex 1/2): 170 000 so'm\n
    • Epstein-Barr virusi: 170 000 so'm\n
    • Inson papillomavirusi 6/11 tiplari: 325 000 so'm\n
    • Inson papillomavirusi 16, 31, 33, 35, 52, 58, 56,18, 39, 45, 59, 6, 11, 51, 68 (HPV) - kvant 15: 420 000 so'm\n
    • Inson papillomavirusi 16/18 tiplari: 150 000 so'm\n
    • Inson papillomavirusi - kvant 21: 565 000 so'm\n
    • Helicobacter pylori: 170 000 so'm\n
    • Mycoplasma hominis: 170 000 so'm\n
    • Mycoplasma genitalium: 170 000 so'm\n
    • Ureaplasma + urealyticum4 + parvum: 170 000 so'm\n
    • Chlamydia trachomatis: 170 000 so'm\n
    • Chlamydia pneumonia: 170 000 so'm\n
    • Trichomonas vaginalis: 170 000 so'm\n
    • Gardnerella Vaginalis: 170 000 so'm\n
    • Candida: 170 000 so'm\n
    • Femoflor 16 (ayollar bioflorasini diagnostikasi): 480 000 so'm\n
    • Femoflor-skreen ayollar uchun: 600 000 so'm\n
    • Androflor (erkaklar bioflorasini diagnostikasi): 600 000 so'm`),
            {
                parse_made: "HTML"
            }
        }
        else if(msg.text == '📍 Lokatsiya') 
        {

            const latitudeOfRedSquare = 41.213319;
            const longitudeOfReadSquare = 69.208338;
        
            await bot.sendLocation(msg.chat.id, latitudeOfRedSquare, longitudeOfReadSquare, 
            {
        
                reply_to_message_id: msg.message_id
        
            })
        
        }
        else if(msg.text == "📞 Biz bilan bog'laning")
        {
            await bot.sendMessage(msg.chat.id, `Biz bilan shu raqam orqali bog'lanishingiz mumkin: +99891 003 09 90`);
        }
        else if(msg.text == "🇺🇿 Til o'zgartirish") 
        {
            await bot.sendMessage(msg.chat.id, `Til tanlang`, {
        
                reply_markup: 
                {

                    keyboard: 
                    [
        
                        ['Русский язык', "O'zbek tili"],
                        
                    ]
        
                }
            }
         )
        }
        else
        {  
            const status = await db.query(`select status from samo where tg_id = $1`,[msg.chat.id])
            
            if (status.rows[0].status=='ru')
            {
                await db.query(`UPDATE SAMO SET status = $1 where tg_id = $2`,['',msg.chat.id])
                await bot.sendMessage(SAMO_JALOBI,msg.text)
                bot.sendMessage(msg.chat.id, 'Спасибо 😊')
            }
            else if(status.rows[0].status=='uz')
            {
                await db.query(`UPDATE SAMO SET status = $1 where tg_id = $2`,['',msg.chat.id])
                await bot.sendMessage(SAMO_JALOBI,msg.text)
                bot.sendMessage(msg.chat.id, 'Raxmat 😊')
            }
            //await bot.sendMessage(msg.chat.id, msg.text);
        }
        

    }
    catch(error) {

        console.log(error);

    }

}

)

bot.on('contact', async contact => 
{
    if (contact.chat.id == contact.contact.user_id)
    {
      try 
      {
        await db.query (`UPDATE SAMO SET tg_number = $1 where tg_id = $2`,[contact.contact.phone_number, contact.chat.id])
        await bot.sendMessage(contact.chat.id, `Скоро мы с вами свяжемся. \nTez orada siz bilan bog'lanamiz. `);
        await bot.sendMessage(SAMO_CONTACT_GROUP,`Номер контакта: ${contact.contact.phone_number}\nИмя контакта: ${contact.contact.first_name}`)
      }
      catch(error) 
      {
        console.log(error);
      }
    }
    else 
    {
        await bot.sendMessage(contact.chat.id,`Это не ваш номер. Попробуйте еще раз либо свяжитесь с нами.\nBu sizning raqamingiz emas. Qayta harakat qilib ko'ring yoki biz bilan bog'laning.`)
    }
})