/**
 * Помощник Huggies: локальная база ответов в браузере (без сетевых запросов).
 */
(function () {
  "use strict";

  const mascot = document.getElementById("mascot-trigger");
  const chatOverlay = document.getElementById("chat-overlay");
  const chatClose = document.getElementById("chat-close");
  const messagesEl = document.getElementById("chat-messages");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  /** Нормализация для поиска: нижний регистр, ё → е */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Слова из текста (простая токенизация) */
  function wordsFrom(text) {
    return normalize(text)
      .split(/[^a-zа-я0-9]+/iu)
      .filter(function (w) {
        return w.length > 1;
      });
  }

  /** Есть ли в тексте подстрока или слово с общим корнем (для «подгузники» / «подгузник») */
  function textHasWord(hay, needle) {
    if (!needle) return false;
    const h = normalize(hay);
    const n = normalize(needle);
    if (h.includes(n)) return true;
    if (n.length >= 4 && h.includes(n.slice(0, n.length - 1))) return true;
    return wordsFrom(h).some(function (w) {
      return w === n || (n.length >= 4 && (w.startsWith(n) || n.startsWith(w.slice(0, 4))));
    });
  }

  /**
   * База знаний: фразы (точное вхождение в вопрос) и/или набор слов (минимум minHits совпадений).
   */
  const KNOWLEDGE = [
    {
      phrases: [
        "как подобрать размер",
        "как выбрать размер",
        "какой размер",
        "таблица размер",
        "размер подгузник",
      ],
      keywords: ["размер", "вес", "килограм", "кг", "таблиц"],
      minHits: 1,
      answer:
        "Размер обычно смотрят по весу малыша и таблице на упаковке. Если ребенок «между» размерами: при протечках по спине чаще пробуют меньший размер; при следах от резинок и сильном жиме — больший. При сомнениях ориентируйтесь на комфорт и отсутствие подтеков.",
    },
    {
      phrases: ["протечк", "утечк", "течет подгузник", "подтекает", "протекает"],
      keywords: ["протеч", "утеч", "подтек", "течет", "луж"],
      minHits: 1,
      answer:
        "Проверьте размер, застежки и посадку: спинка на уровне талии, липучки симметрично. На ночь можно взять линейку с усиленной впитываемостью. Если протечки повторяются часто — обсудите с педиатром.",
    },
    {
      phrases: ["как часто менять", "сколько раз в день", "частота смены"],
      keywords: ["часто", "смен", "раз в день"],
      minHits: 2,
      answer:
        "Частота зависит от возраста и режима. Ориентир — при каждом кормлении и сразу после стула; не оставляйте мокрый подгузник надолго. Ночью — по наполненности.",
    },
    {
      phrases: ["ночн", "спит ночь", "на ночь"],
      keywords: ["ночь", "спит", "сон", "ночн"],
      minHits: 1,
      answer:
        "Для ночи подойдет линейка «Ночная защита» с усиленной впитываемостью. Перед сном проверьте посадку и застегните аккуратно — так меньше риск протечек к утру.",
    },
    {
      phrases: ["новорожден", "для малышей от рождения", "первые недели"],
      keywords: ["новорожден", "младенец", "пупок", "пупоч"],
      minHits: 1,
      answer:
        "Линейка для новорожденных рассчитана на нежную кожу и частые смены. Следите за вырезом под пупок (если он есть на модели), меняйте вовремя и при необходимости используйте средства по совету врача.",
    },
    {
      phrases: ["активн", "ползает", "ходит", "движен"],
      keywords: ["активн", "полза", "шаг", "игр"],
      minHits: 2,
      answer:
        "Линейка «Активные малыши» ориентирована на подвижных детей: важны посадка при движении и фиксация. Если натирает — проверьте размер и кромку по ножкам.",
    },
    {
      phrases: ["трусики", "подгузник трусики", "переход на трусики"],
      keywords: ["трусик"],
      minHits: 1,
      answer:
        "Трусики удобны, когда малыш активнее и привык к смене стоя. Подбирайте размер по весу; при протечках проверьте, что резинка по бедрам не слишком свободная.",
    },
    {
      phrases: ["покрасн", "опрелост", "раздражен", "сыпь", "аллерг"],
      keywords: ["кож", "покрасн", "опрел", "сыпь", "аллерг", "зуд"],
      minHits: 2,
      answer:
        "Меняйте подгузник вовремя, промокайте кожу без трения, при необходимости используйте крем по рекомендации врача. При сильном раздражении, температуре или ухудшении состояния обратитесь к педиатру.",
    },
    {
      phrases: ["как надеть", "как одеть подгузник", "правильно надеть"],
      keywords: ["надеть", "одеть", "застег", "липучк"],
      minHits: 2,
      answer:
        "Разверните подгузник, посадите малыша, подтяните переднюю часть вверх. Липучки должны быть симметрично, без перекоса; не перетягивайте. Для новорожденных следите за положением пупка по инструкции на упаковке.",
    },
    {
      phrases: ["состав", "материал", "химия", "гипоаллерген"],
      keywords: ["состав", "материал", "слой", "гипоаллерген", "без отдуш"],
      minHits: 2,
      answer:
        "У разных линеек могут отличаться слои и материалы. Точный состав и рекомендации указаны на упаковке и на официальном сайте бренда. При аллергии обсудите выбор с врачом.",
    },
    {
      phrases: ["где купить", "купить", "магазин", "цена", "стоит"],
      keywords: ["купить", "магазин", "цена", "акци"],
      minHits: 2,
      answer:
        "В прототипе нет корзины и цен — это демо-сайт. В реальном проекте здесь были бы ссылки на партнеров и актуальные предложения сетей.",
    },
    {
      phrases: ["huggies", "хаггис", "кимберли", "kimberly"],
      keywords: ["huggies", "хаггис", "kimberly", "кларк"],
      minHits: 1,
      answer:
        "Huggies — бренд товаров для малышей из портфеля Kimberly-Clark. На этом сайте можно посмотреть линейки: для новорожденных, активных малышей и ночную защиту.",
    },
    {
      phrases: ["сторис", "истории", "круги сверху"],
      keywords: ["сторис", "истори", "круг"],
      minHits: 1,
      answer:
        "Сторис — вверху главной страницы: нажмите на круглое превью, чтобы открыть историю на весь экран.",
    },
    {
      phrases: ["эко", "многоразов", "тряпочн", "стирать"],
      keywords: ["эко", "многоразов", "ткан", "стира"],
      minHits: 2,
      answer:
        "Одноразовые подгузники удобны в дороге и на ночь; многоразовые — другой формат ухода. Выбор зависит от режима семьи; важны сухость кожи и своевременная смена.",
    },
    {
      phrases: ["плаван", "бассейн", "вода"],
      keywords: ["плаван", "бассейн", "вода"],
      minHits: 1,
      answer:
        "Для бассейна используют специальные плавательные подгузники (если они есть в линейке). Обычный подгузник в воду не предназначен — ориентируйтесь на подпись на упаковке.",
    },
    {
      phrases: ["запах", "пахнет", "аромат"],
      keywords: ["запах", "пахнет", "аромат", "отдуш"],
      minHits: 1,
      answer:
        "Если запах резко изменился или появился необычный при запахе мочи — это повод обратиться к врачу. Смените подгузник и не используйте сильно парфюмированные средства без рекомендации специалиста.",
    },
    {
      phrases: ["сколько штук", "упаковк", "запас"],
      keywords: ["упаков", "штук", "запас", "больш"],
      minHits: 2,
      answer:
        "Объем упаковки зависит от формата (мини, мега и т.д.). Для ориентира оцените, сколько подгузников уходит в день, и умножьте на неделю — так проще планировать запас.",
    },
    {
      phrases: ["моча", "цвет мочи", "мало писает"],
      keywords: ["моча", "писа", "жидкост"],
      minHits: 2,
      answer:
        "Изменения мочи, жажда, мало мокрых подгузников или беспокойство — это вопросы к педиатру. Помощник не диагностирует, только напоминает про своевременную смену и питьевой режим по возрасту.",
    },
    {
      phrases: ["стул", "какаш", "понос", "жидкий стул"],
      keywords: ["стул", "понос", "диаре", "жидк"],
      minHits: 2,
      answer:
        "При частом жидком стуле, температуре или вялости малыша нужна консультация врача. Меняйте подгузник сразу после опорожнения и мягко промокайте кожу.",
    },
  ];

  const GENERIC_TIPS = [
    "Следите за тем, чтобы подгузник сидел ровно: спинка на уровне талии, не перетягивайте липучки.",
    "Между размерами ориентируйтесь на комфорт малыша и отсутствие следов от резинок.",
    "На ночь можно выбрать более впитывающую линейку, если вечером малыш много пьет.",
    "При сомнениях о здоровье кожи или самочувствии малыша лучше обсудить это с педиатром.",
    "Перед сменой подготовьте все заранее — так спокойнее и малышу, и вам.",
  ];

  const REGEX_INTENTS = [
    {
      re: /^(привет|здравствуй|hello|hi\b|добрый день|добрый вечер|доброе утро)/,
      answer:
        "Здравствуйте! Я отвечаю по базе типовых вопросов о подгузниках Huggies: размеры, смена, линейки, уход за кожей. По здоровью малыша консультируйтесь с врачом.",
    },
    {
      re: /спасибо|благодар|thanks/,
      answer: "Пожалуйста! Если появятся еще вопросы — я на связи. Можете нажать на пример ниже или написать свой вопрос.",
    },
    {
      re: /пока|до свидания|все понятно/,
      answer: "До свидания! Заходите снова, если понадобится подсказка по уходу или линейкам Huggies.",
    },
    {
      re: /что ты умеешь|что умеешь|помощь|help|как пользоваться/,
      answer:
        "Я подбираю ответ из базы по вашему вопросу. Спросите, например, про размер, протечки, ночную линейку, новорожденных или раздражение кожи — или нажмите один из примеров в переписке выше.",
    },
  ];

  function matchKnowledge(qNorm) {
    var i;
    var j;
    var entry;
    var hits;
    var best;
    var bestHits = 0;

    for (i = 0; i < KNOWLEDGE.length; i++) {
      entry = KNOWLEDGE[i];
      if (entry.phrases) {
        for (j = 0; j < entry.phrases.length; j++) {
          if (qNorm.indexOf(entry.phrases[j]) !== -1) {
            return entry.answer;
          }
        }
      }
    }

    for (i = 0; i < KNOWLEDGE.length; i++) {
      entry = KNOWLEDGE[i];
      if (!entry.keywords || !entry.keywords.length) continue;
      hits = 0;
      for (j = 0; j < entry.keywords.length; j++) {
        if (textHasWord(qNorm, entry.keywords[j])) hits++;
      }
      var need = entry.minHits != null ? entry.minHits : 2;
      if (hits >= need && hits > bestHits) {
        bestHits = hits;
        best = entry.answer;
      }
    }
    if (best) return best;

    return null;
  }

  function replyToQuestion(raw) {
    var q = normalize(raw);
    if (q.length < 2) {
      return "Напишите вопрос чуть подробнее — например: «как подобрать размер» или «подгузник протекает».";
    }

    var ri;
    for (ri = 0; ri < REGEX_INTENTS.length; ri++) {
      if (REGEX_INTENTS[ri].re.test(q)) {
        return REGEX_INTENTS[ri].answer;
      }
    }

    var fromKb = matchKnowledge(q);
    if (fromKb) return fromKb;

    var tip = GENERIC_TIPS[Math.floor(Math.random() * GENERIC_TIPS.length)];
    return (
      "По вашей формулировке я не нашел точного совпадения в базе. Вот общий ориентир: " +
      tip +
      " Уточните вопрос (размер, ночь, протечки, кожа) или выберите пример ниже."
    );
  }

  function openChat() {
    if (!chatOverlay) return;
    chatOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    if (inputEl) inputEl.focus();
  }

  function closeChat() {
    if (!chatOverlay) return;
    chatOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (mascot) mascot.addEventListener("click", openChat);
  if (chatClose) chatClose.addEventListener("click", closeChat);
  if (chatOverlay) {
    chatOverlay.addEventListener("click", function (e) {
      if (e.target === chatOverlay) closeChat();
    });
  }

  function appendMsg(text, role) {
    if (!messagesEl) return;
    var div = document.createElement("div");
    div.className = "msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    if (!messagesEl) return null;
    var el = document.createElement("div");
    el.className = "msg bot typing";
    el.id = "chat-typing-indicator";
    el.textContent = "Печатает…";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function hideTyping() {
    var t = document.getElementById("chat-typing-indicator");
    if (t) t.remove();
  }

  var QUICK_QUESTIONS = [
    "Как подобрать размер подгузника?",
    "Подгузник протекает — что делать?",
    "Как часто менять подгузник?",
    "Чем отличается ночная линейка?",
    "Раздражение на коже — что делать?",
  ];

  function injectQuickReplies() {
    if (!messagesEl || document.getElementById("chat-quick")) return;

    var wrap = document.createElement("div");
    wrap.id = "chat-quick";
    wrap.className = "chat-quick";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Примеры вопросов");

    var qi;
    var b;
    for (qi = 0; qi < QUICK_QUESTIONS.length; qi++) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "chat-quick__btn";
      b.textContent = QUICK_QUESTIONS[qi];
      b.addEventListener("click", function () {
        var q = this.textContent;
        if (inputEl) inputEl.value = q;
        send();
      });
      wrap.appendChild(b);
    }

    var firstBot = messagesEl.querySelector(".msg.bot");
    if (firstBot) {
      firstBot.after(wrap);
    } else {
      messagesEl.prepend(wrap);
    }
  }

  var sending = false;

  function send() {
    if (sending) return;
    var text = (inputEl && inputEl.value.trim()) || "";
    if (!text) return;

    sending = true;
    if (sendBtn) sendBtn.disabled = true;

    appendMsg(text, "user");
    if (inputEl) inputEl.value = "";

    showTyping();

    var delay = 320 + Math.floor(Math.random() * 280);
    window.setTimeout(function () {
      hideTyping();
      appendMsg(replyToQuestion(text), "bot");
      sending = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) inputEl.focus();
    }, delay);
  }

  if (sendBtn) sendBtn.addEventListener("click", send);
  if (inputEl) {
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        send();
      }
    });
  }
  if (messagesEl) {
    messagesEl.setAttribute("aria-live", "polite");
    messagesEl.setAttribute("aria-relevant", "additions");
  }

  if (messagesEl && messagesEl.children.length === 0) {
    appendMsg(
      "Здравствуйте! Задайте вопрос о подгузниках и уходе за малышом — постараюсь кратко подсказать.",
      "bot"
    );
  }

  injectQuickReplies();
})();
